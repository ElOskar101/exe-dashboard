import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/app'
import {
  AuthProvider,
  listenForToken,
  setupAuthInterceptors,
} from '@/features/auth'
import fetcher from '@/lib/axios'
import i18n from '@/lib/i18n'

listenForToken((t) => localStorage.setItem('token', t))
setupAuthInterceptors(fetcher)

i18n.init()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
