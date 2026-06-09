import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { defaultNS, resources } from './i18n-resources'

i18n.use(initReactI18next).init({
  resources,
  ns: ['common', 'notFound', 'underConstruction', 'routes', 'home', 'executions', 'settings'],
  defaultNS,
  fallbackLng: 'en',
  lng: 'en',
  debug: import.meta.env.DEV,
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
