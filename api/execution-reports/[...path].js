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

  return typeof value === 'string' ? [value] : []
}

const getProxyTargetUrl = (request) => {
  const [encodedOrigin, ...targetPathSegments] = getPathSegments(request.query.path)

  if (!encodedOrigin || targetPathSegments.length === 0) {
    return null
  }

  const origin = decodeURIComponent(encodedOrigin)
  const originUrl = new URL(origin)

  if (!['http:', 'https:'].includes(originUrl.protocol) || originUrl.username || originUrl.password) {
    return null
  }

  const requestUrl = new URL(request.url, `https://${request.headers.host}`)
  const targetUrl = new URL(`/${targetPathSegments.join('/')}`, originUrl.origin)
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

  const upstreamResponse = await fetch(targetUrl)

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
