import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/app'
import { listenForToken, setupAuthInterceptors } from '@/features/auth'
import { AppProviders } from './app/providers'
import cccClient from '@/lib/axios'
import '@/lib/i18n'
import './app/register-vite-preload-error-handler'

listenForToken((t) => localStorage.setItem('token', t))
setupAuthInterceptors(cccClient)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
