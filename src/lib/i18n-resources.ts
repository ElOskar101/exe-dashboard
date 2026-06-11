import common from '@/locales/en/common.json'
import executions from '@/locales/en/executions.json'
import home from '@/locales/en/home.json'
import notFound from '@/locales/en/notFound.json'
import routes from '@/locales/en/routes.json'
import runtimes from '@/locales/en/runtimes.json'
import settings from '@/locales/en/settings.json'
import underConstruction from '@/locales/en/underConstruction.json'

export const defaultNS = 'common'

export const resources = {
  en: {
    common,
    executions,
    home,
    notFound,
    routes,
    runtimes,
    settings,
    underConstruction,
  },
} as const

export type Resources = (typeof resources)['en']
