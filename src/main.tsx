import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app'
import { listenForToken } from './utils/token-listener'
import i18n from './i18n'
import { AuthProvider } from './context/auth-context/provider'

listenForToken((t) => localStorage.setItem('token', t))

i18n.init()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
