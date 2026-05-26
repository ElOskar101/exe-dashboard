import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { IconAlertCircle } from '@tabler/icons-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

const reportRuntimeShim = `
<script>
(() => {
  const storageState = { theme: 'light-mode' }
  const storage = {
    get length() {
      return Object.keys(storageState).length
    },
    key(index) {
      return Object.keys(storageState)[index] || null
    },
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(storageState, key) ? storageState[key] : null
    },
    setItem(key, value) {
      storageState[key] = String(value)
    },
    removeItem(key) {
      delete storageState[key]
    },
    clear() {
      for (const key of Object.keys(storageState)) delete storageState[key]
    },
  }

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  })

  document.addEventListener(
    'click',
    (event) => {
      const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null

      if (!(link instanceof HTMLAnchorElement)) {
        return
      }

      const href = link.getAttribute('href')

      if (!href || href === '#') {
        return
      }

      event.preventDefault()

      if (window.location.hash === href) {
        window.dispatchEvent(new HashChangeEvent('hashchange'))
        return
      }

      window.location.hash = href
    },
    true,
  )
})()
</script>`

const isolateReportHtml = (html: string) => {
  if (/<head(\s[^>]*)?>/i.test(html)) {
    return html.replace(/<head(\s[^>]*)?>/i, (headTag) => `${headTag}${reportRuntimeShim}`)
  }

  return `${reportRuntimeShim}${html}`
}

interface ExecutionReportPanelProps {
  isError: boolean
  isLoading: boolean
  reportHtml?: string
}

export function ExecutionReportPanel({ isError, isLoading, reportHtml }: ExecutionReportPanelProps) {
  const { t } = useTranslation('executions')
  const isolatedReportHtml = useMemo(() => (reportHtml ? isolateReportHtml(reportHtml) : undefined), [reportHtml])

  if (isLoading) {
    return (
      <Skeleton aria-label={t('detail.reportLoading')} className="h-[calc(100vh-16rem)] min-h-96 w-full rounded-2xl" />
    )
  }

  if (isError || !reportHtml) {
    return (
      <Alert variant="destructive">
        <IconAlertCircle />
        <AlertTitle>{t('detail.reportErrorTitle')}</AlertTitle>
        <AlertDescription>{t('detail.reportErrorDescription')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <iframe
      className="h-[calc(100vh-16rem)] min-h-96 w-full rounded-2xl border border-border bg-background"
      referrerPolicy="no-referrer"
      sandbox="allow-same-origin allow-scripts"
      srcDoc={isolatedReportHtml}
      title={t('detail.reportFrameTitle')}
    />
  )
}
