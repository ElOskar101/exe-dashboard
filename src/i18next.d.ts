/* eslint-disable no-unused-vars */
import { defaultNS, type Resources } from '@/lib/i18n-resources'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: Resources
    strictKeyChecks: true
  }
}
