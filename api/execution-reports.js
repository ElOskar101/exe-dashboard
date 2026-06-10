const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

const BLOCKING_EMBED_HEADERS = new Set(['content-security-policy', 'x-frame-options'])
const PROXY_QUERY_PARAMS = new Set(['path', 'reportTheme'])
const REPORT_THEMES = new Set(['dark', 'light'])

const getReportTheme = (requestUrl) => {
  const reportTheme = requestUrl.searchParams.get('reportTheme')

  return REPORT_THEMES.has(reportTheme) ? reportTheme : null
}

const getPathSegments = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap(getPathSegments)
  }

  return typeof value === 'string' ? value.split('/') : []
}

const decodeReportProxyOrigin = (value) => {
  try {
    const origin = Buffer.from(value, 'base64url').toString('utf8')
    const originUrl = new URL(origin)

    if (['http:', 'https:'].includes(originUrl.protocol) && originUrl.pathname === '/') {
      return originUrl.origin
    }
  } catch {
    // Fall back to the legacy percent-encoded origin format.
  }

  return decodeURIComponent(value)
}

const isValidProxyTargetUrl = (targetUrl) =>
  ['http:', 'https:'].includes(targetUrl.protocol) &&
  !targetUrl.username &&
  !targetUrl.password &&
  targetUrl.pathname !== '/'

const getProxyTargetUrlFromOriginSegment = (pathSegments) => {
  const [encodedOrigin, ...targetPathSegments] = pathSegments

  if (!encodedOrigin || targetPathSegments.length === 0) {
    return null
  }

  const targetUrl = new URL(`/${targetPathSegments.join('/')}`, decodeReportProxyOrigin(encodedOrigin))

  return isValidProxyTargetUrl(targetUrl) ? targetUrl : null
}

const getProxyTargetUrlFromLegacyFullPath = (pathSegments) => {
  const proxyPath = pathSegments.join('/')

  if (!proxyPath) {
    return null
  }

  const targetUrl = new URL(decodeURIComponent(proxyPath))

  return isValidProxyTargetUrl(targetUrl) ? targetUrl : null
}

const appendForwardedSearchParams = (targetUrl, requestUrl) => {
  for (const [key, value] of requestUrl.searchParams) {
    if (!PROXY_QUERY_PARAMS.has(key)) {
      targetUrl.searchParams.append(key, value)
    }
  }
}

const getProxyTargetUrl = (request) => {
  const pathSegments = getPathSegments(request.query.path)
  const targetUrl =
    getProxyTargetUrlFromOriginSegment(pathSegments) ?? getProxyTargetUrlFromLegacyFullPath(pathSegments)

  if (!targetUrl) {
    return null
  }

  const requestUrl = new URL(request.url, `https://${request.headers.host}`)
  appendForwardedSearchParams(targetUrl, requestUrl)

  return {
    reportTheme: getReportTheme(requestUrl),
    targetUrl,
  }
}

const getThemedHtml = (html, reportTheme) => {
  if (!reportTheme) {
    return html
  }

  const playwrightTheme = `${reportTheme}-mode`
  const themeScript = `<script>(()=>{const theme=${JSON.stringify(playwrightTheme)};try{localStorage.theme=theme}catch{}document.documentElement.classList.remove('dark','light','dark-mode','light-mode');document.documentElement.classList.add(theme);document.documentElement.style.colorScheme=${JSON.stringify(reportTheme)}})();</script>`

  if (/<head[\s>]/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${themeScript}`)
  }

  return `${themeScript}${html}`
}

export default async function handler(request, response) {
  if (!['GET', 'HEAD'].includes(request.method ?? 'GET')) {
    response.setHeader('allow', 'GET, HEAD')
    response.status(405).end()
    return
  }

  let proxyTarget

  try {
    proxyTarget = getProxyTargetUrl(request)
  } catch {
    proxyTarget = null
  }

  if (!proxyTarget) {
    response.status(400).send('Invalid execution report proxy target.')
    return
  }

  const upstreamResponse = await fetch(proxyTarget.targetUrl, { method: request.method })

  response.status(upstreamResponse.status)
  upstreamResponse.headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase()

    if (!HOP_BY_HOP_HEADERS.has(normalizedKey) && !BLOCKING_EMBED_HEADERS.has(normalizedKey)) {
      response.setHeader(key, value)
    }
  })

  if (request.method === 'HEAD') {
    response.end()
    return
  }

  const contentType = upstreamResponse.headers.get('content-type') ?? ''

  if (contentType.includes('text/html')) {
    const body = getThemedHtml(await upstreamResponse.text(), proxyTarget.reportTheme)

    response.send(body)
    return
  }

  const body = Buffer.from(await upstreamResponse.arrayBuffer())
  response.send(body)
}
