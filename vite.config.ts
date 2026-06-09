import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { Buffer } from 'node:buffer'
import { fileURLToPath, URL } from 'node:url'
import { APP_CONFIG } from './src/app.config'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))
const reactPath = fileURLToPath(new URL('./node_modules/react/index.js', import.meta.url))
const reactJsxRuntimePath = fileURLToPath(new URL('./node_modules/react/jsx-runtime.js', import.meta.url))
const reactJsxDevRuntimePath = fileURLToPath(new URL('./node_modules/react/jsx-dev-runtime.js', import.meta.url))
const reactDomPath = fileURLToPath(new URL('./node_modules/react-dom/index.js', import.meta.url))
const reactDomClientPath = fileURLToPath(new URL('./node_modules/react-dom/client.js', import.meta.url))
const exeReportsProxyTarget = new URL(APP_CONFIG.exeReportsUrl).origin
const executionReportsProxyPrefix = '/api/execution-reports'

const decodeReportProxyOrigin = (value: string) => {
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

const getExecutionReportsProxyParts = (path: string) => {
  const proxyPath = path.slice(executionReportsProxyPrefix.length + 1)
  const [encodedOrigin = '', ...targetPathSegments] = proxyPath.split('/')

  return {
    encodedOrigin,
    origin: decodeReportProxyOrigin(encodedOrigin),
    targetPath: `/${targetPathSegments.join('/')}`,
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      [executionReportsProxyPrefix]: {
        target: exeReportsProxyTarget,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyResponse) => {
            delete proxyResponse.headers['content-security-policy']
            delete proxyResponse.headers['x-frame-options']
          })
        },
        rewrite: (path) => getExecutionReportsProxyParts(path).targetPath,
        router: (request) => {
          if (!request.url) {
            return exeReportsProxyTarget
          }

          const { origin } = getExecutionReportsProxyParts(request.url)

          return origin
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom/client'],
    alias: [
      { find: '@', replacement: srcPath },
      { find: /^react$/, replacement: reactPath },
      { find: /^react\/jsx-runtime$/, replacement: reactJsxRuntimePath },
      { find: /^react\/jsx-dev-runtime$/, replacement: reactJsxDevRuntimePath },
      { find: /^react-dom$/, replacement: reactDomPath },
      { find: /^react-dom\/client$/, replacement: reactDomClientPath },
    ],
  },
})
