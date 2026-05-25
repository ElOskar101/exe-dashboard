import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { IconAlertCircle } from '@tabler/icons-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { APP_CONFIG } from '@/app.config'
import { useObjectUrl } from '@/hooks/use-object-url'

const createReportStorageShim = () => {
  const script = document.createElement('script')
  script.textContent = `
    (() => {
      const storage = {
        get length() {
          return 1
        },
        key(index) {
          return index === 0 ? 'theme' : null
        },
        getItem(key) {
          return key === 'theme' ? 'light-mode' : null
        },
        setItem(key, value) {
          storage[key] = String(value)
        },
        removeItem(key) {
          delete storage[key]
        },
        clear() {
          for (const key of Object.keys(storage)) {
            if (typeof storage[key] !== 'function') delete storage[key]
          }
          storage.theme = 'light-mode'
        },
        theme: 'light-mode',
      }

      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        value: storage,
      })
    })()
  `

  return script
}

interface ExecutionReportPanelProps {
  executionId: string
  isError: boolean
  isLoading: boolean
  reportHtml?: string
}

export function ExecutionReportPanel({ executionId, isError, isLoading, reportHtml }: ExecutionReportPanelProps) {
  const { t } = useTranslation('executions')
  const reportDocumentHtml = useMemo(() => {
    if (!reportHtml) return undefined

    const reportDocument = new DOMParser().parseFromString(reportHtml, 'text/html')
    const reportBaseElement = reportDocument.createElement('base')
    reportBaseElement.href = new URL(
      `${APP_CONFIG.exeReportsUrl}/${encodeURIComponent(executionId)}/`,
      window.location.origin,
    ).href
    reportDocument.head.prepend(reportBaseElement)
    reportDocument.head.prepend(createReportStorageShim())

    return `<!doctype html>${reportDocument.documentElement.outerHTML}`
  }, [executionId, reportHtml])
  const reportDocumentUrl = useObjectUrl(reportDocumentHtml, 'text/html')

  if (isLoading || (reportDocumentHtml && !reportDocumentUrl)) {
    return <Skeleton aria-label={t('detail.reportLoading')} className="h-full min-h-96 w-full rounded-2xl" />
  }

  if (isError || !reportDocumentUrl) {
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
      className="h-full min-h-96 w-full rounded-2xl border border-border bg-background"
      referrerPolicy="no-referrer"
      sandbox="allow-scripts"
      src={reportDocumentUrl}
      title={t('detail.reportFrameTitle')}
    />
  )
}
