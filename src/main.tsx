import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/app'
import { AuthProvider, listenForToken } from '@/features/auth'
import i18n from '@/lib/i18n'

listenForToken((t) => localStorage.setItem('token', t))

i18n.init()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
