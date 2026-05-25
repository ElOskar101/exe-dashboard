import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))
const reactPath = fileURLToPath(new URL('./node_modules/react/index.js', import.meta.url))
const reactJsxRuntimePath = fileURLToPath(new URL('./node_modules/react/jsx-runtime.js', import.meta.url))
const reactJsxDevRuntimePath = fileURLToPath(new URL('./node_modules/react/jsx-dev-runtime.js', import.meta.url))
const reactDomPath = fileURLToPath(new URL('./node_modules/react-dom/index.js', import.meta.url))
const reactDomClientPath = fileURLToPath(new URL('./node_modules/react-dom/client.js', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
  },
  server: {
    proxy: {
      '/execution-api': {
        target: 'https://api.controlcentralcarrier.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/execution-api/, '/api/v1'),
      },
      '/execution-reports': {
        target: 'https://api.controlcentralcarrier.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/execution-reports/, '/reports'),
      },
    },
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
