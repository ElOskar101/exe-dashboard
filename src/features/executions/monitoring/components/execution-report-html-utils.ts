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

export type ExecutionReportTheme = 'light' | 'dark'

const getPlaywrightReportTheme = (theme: ExecutionReportTheme) => `${theme}-mode`

const createReportHeadInjection = (reportBaseUrl: string, theme: ExecutionReportTheme) => {
  const playwrightTheme = getPlaywrightReportTheme(theme)

  return `
<base href="${escapeHtmlAttribute(reportBaseUrl)}" />
<script>
(() => {
  const reportBaseUrl = ${JSON.stringify(reportBaseUrl)}
  const reportTheme = ${JSON.stringify(playwrightTheme)}
  const nativeLocalStorage = window.localStorage
  const reportStorageState = { theme: reportTheme }
  const reportStorage = new Proxy(nativeLocalStorage, {
    get(target, property, receiver) {
      if (property === 'theme') {
        return reportStorageState.theme
      }

      if (property === 'getItem') {
        return (key) => (key === 'theme' ? reportStorageState.theme : target.getItem(key))
      }

      if (property === 'setItem') {
        return (key, value) => {
          if (key === 'theme') {
            reportStorageState.theme = String(value)
            return
          }

          target.setItem(key, value)
        }
      }

      if (property === 'removeItem') {
        return (key) => {
          if (key === 'theme') {
            reportStorageState.theme = reportTheme
            return
          }

          target.removeItem(key)
        }
      }

      if (property === 'clear') {
        return () => {
          reportStorageState.theme = reportTheme
          target.clear()
        }
      }

      return Reflect.get(target, property, receiver)
    },
    set(target, property, value, receiver) {
      if (property === 'theme') {
        reportStorageState.theme = String(value)
        return true
      }

      return Reflect.set(target, property, value, receiver)
    },
  })

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: reportStorage,
  })
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: reportStorage,
  })
  document.documentElement.classList.remove('dark-mode', 'light-mode')
  document.documentElement.classList.add(reportTheme)

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

  const resolveReportUrl = (value) => new URL(value, reportBaseUrl).toString()

  document.addEventListener(
    'click',
    (event) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null

      if (!(link instanceof HTMLAnchorElement)) {
        return
      }

      const href = link.getAttribute('href')

      if (!href || href === '#') {
        return
      }

      if (!href.startsWith('#')) {
        event.preventDefault()
        window.open(resolveReportUrl(href), '_blank', 'noopener,noreferrer')
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
}

export const isolateReportHtml = (html: string, reportBaseUrl: string, theme: ExecutionReportTheme = 'light') => {
  const reportHeadInjection = createReportHeadInjection(reportBaseUrl, theme)

  if (/<head(\s[^>]*)?>/i.test(html)) {
    return html.replace(/<head(\s[^>]*)?>/i, (headTag) => `${headTag}${reportHeadInjection}`)
  }

  return `${reportHeadInjection}${html}`
}
