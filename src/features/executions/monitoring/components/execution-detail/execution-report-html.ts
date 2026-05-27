const ensureTrailingSlash = (value: string) => (value.endsWith('/') ? value : `${value}/`)

const escapeHtmlAttribute = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

export const resolveExecutionReportBaseUrl = (
  reportBasePath: string,
  origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
) => new URL(ensureTrailingSlash(reportBasePath), origin).toString()

const createReportRuntimeShim = (reportBaseUrl: string) => `
<base href="${escapeHtmlAttribute(reportBaseUrl)}" />
<script>
(() => {
  const reportBaseUrl = ${JSON.stringify(reportBaseUrl)}
  const storageState = { theme: 'light-mode' }
  const storage = {
    get length() {
      return Object.keys(storageState).length
    },
    key(index) {
      return Object.keys(storageState)[index] || null
    },
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(storageState, key) ? storageState[key] : null
    },
    setItem(key, value) {
      storageState[key] = String(value)
    },
    removeItem(key) {
      delete storageState[key]
    },
    clear() {
      for (const key of Object.keys(storageState)) delete storageState[key]
    },
  }

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  })

  const NativeURL = window.URL
  const urlSchemePattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:/
  const opaqueBaseSchemes = ['about:', 'blob:', 'data:']
  const hasExplicitScheme = (value) => urlSchemePattern.test(value) || value.startsWith('//')
  const hasOpaqueBaseScheme = (value) => opaqueBaseSchemes.some((prefix) => value.startsWith(prefix))
  const resolveUrlArguments = (input, base) => {
    const normalizedInput = typeof input === 'string' ? input : String(input)

    if (base == null) {
      return hasExplicitScheme(normalizedInput) ? [input, undefined] : [input, reportBaseUrl]
    }

    const normalizedBase = typeof base === 'string' ? base : String(base)

    if (normalizedBase === window.location.href || hasOpaqueBaseScheme(normalizedBase)) {
      return [input, reportBaseUrl]
    }

    return [input, base]
  }

  class ReportURL extends NativeURL {
    constructor(input, base) {
      const [nextInput, nextBase] = resolveUrlArguments(input, base)

      if (nextBase === undefined) {
        super(nextInput)
        return
      }

      super(nextInput, nextBase)
    }

    static canParse(input, base) {
      const [nextInput, nextBase] = resolveUrlArguments(input, base)

      if (typeof NativeURL.canParse === 'function') {
        return nextBase === undefined ? NativeURL.canParse(nextInput) : NativeURL.canParse(nextInput, nextBase)
      }

      try {
        if (nextBase === undefined) {
          new NativeURL(nextInput)
        } else {
          new NativeURL(nextInput, nextBase)
        }

        return true
      } catch {
        return false
      }
    }
  }

  Object.defineProperty(window, 'URL', {
    configurable: true,
    value: ReportURL,
  })
  Object.defineProperty(globalThis, 'URL', {
    configurable: true,
    value: ReportURL,
  })

  document.addEventListener(
    'click',
    (event) => {
      const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null

      if (!(link instanceof HTMLAnchorElement)) {
        return
      }

      const href = link.getAttribute('href')

      if (!href || href === '#') {
        return
      }

      event.preventDefault()

      if (window.location.hash === href) {
        window.dispatchEvent(new HashChangeEvent('hashchange'))
        return
      }

      window.location.hash = href
    },
    true,
  )
})()
</script>`

export const isolateReportHtml = (html: string, reportBaseUrl: string) => {
  const reportRuntimeShim = createReportRuntimeShim(reportBaseUrl)

  if (/<head(\s[^>]*)?>/i.test(html)) {
    return html.replace(/<head(\s[^>]*)?>/i, (headTag) => `${headTag}${reportRuntimeShim}`)
  }

  return `${reportRuntimeShim}${html}`
}
