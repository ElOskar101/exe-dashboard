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

const getPathSegments = (value) => {
  if (Array.isArray(value)) {
    return value
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

const getProxyTargetUrl = (request) => {
  const pathSegments = getPathSegments(request.query.path)
  const targetUrl =
    getProxyTargetUrlFromOriginSegment(pathSegments) ?? getProxyTargetUrlFromLegacyFullPath(pathSegments)

  if (!targetUrl) {
    return null
  }

  const requestUrl = new URL(request.url, `https://${request.headers.host}`)
  targetUrl.search = requestUrl.search

  return targetUrl
}

export default async function handler(request, response) {
  if (!['GET', 'HEAD'].includes(request.method ?? 'GET')) {
    response.setHeader('allow', 'GET, HEAD')
    response.status(405).end()
    return
  }

  let targetUrl

  try {
    targetUrl = getProxyTargetUrl(request)
  } catch {
    targetUrl = null
  }

  if (!targetUrl) {
    response.status(400).send('Invalid execution report proxy target.')
    return
  }

  const upstreamResponse = await fetch(targetUrl, { method: request.method })

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

  const body = Buffer.from(await upstreamResponse.arrayBuffer())
  response.send(body)
}
