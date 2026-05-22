import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/app'
import { listenForToken, setupAuthInterceptors } from '@/features/auth'
import { AppProviders } from './app/providers'
import cccClient from '@/lib/axios'
import i18n from '@/lib/i18n'

listenForToken((t) => localStorage.setItem('token', t))
setupAuthInterceptors(cccClient)

i18n.init()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
