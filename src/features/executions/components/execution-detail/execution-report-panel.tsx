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

const createReportRuntimeErrorHandler = () => {
  const script = document.createElement('script')
  script.textContent = `
    (() => {
      const renderReportError = (error) => {
        const message = error?.message || String(error || 'Unknown error')
        const stack = error?.stack || ''
        const render = () => {
          document.body.replaceChildren()

          const container = document.createElement('section')
          container.style.cssText = 'box-sizing:border-box;margin:16px;padding:16px;border:1px solid #fca5a5;border-radius:16px;background:#fef2f2;color:#7f1d1d;font:14px system-ui,sans-serif;'

          const title = document.createElement('h1')
          title.textContent = 'Execution report could not be loaded'
          title.style.cssText = 'margin:0 0 8px;font-size:16px;font-weight:600;'

          const description = document.createElement('p')
          description.textContent = message
          description.style.cssText = 'margin:0;'

          container.append(title, description)

          if (stack) {
            const details = document.createElement('pre')
            details.textContent = stack
            details.style.cssText = 'margin:12px 0 0;white-space:pre-wrap;overflow:auto;font:12px ui-monospace,SFMono-Regular,Menlo,monospace;'
            container.append(details)
          }

          document.body.append(container)
        }

        if (document.body) {
          render()
          return
        }

        window.addEventListener('DOMContentLoaded', render, { once: true })
      }

      window.addEventListener('error', (event) => {
        event.preventDefault()
        renderReportError(event.error || event.message)
      })
      window.addEventListener('unhandledrejection', (event) => {
        event.preventDefault()
        renderReportError(event.reason)
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
  const reportDocumentResult = useMemo(() => {
    if (!reportHtml) return { error: null, html: undefined }

    try {
      const reportDocument = new DOMParser().parseFromString(reportHtml, 'text/html')
      const reportBaseElement = reportDocument.createElement('base')
      reportBaseElement.href = new URL(
        `${APP_CONFIG.exeReportsUrl}/${encodeURIComponent(executionId)}/`,
        window.location.origin,
      ).href
      reportDocument.head.prepend(reportBaseElement)
      reportDocument.head.prepend(createReportStorageShim())
      reportDocument.head.prepend(createReportRuntimeErrorHandler())

      return { error: null, html: `<!doctype html>${reportDocument.documentElement.outerHTML}` }
    } catch (error) {
      return { error, html: undefined }
    }
  }, [executionId, reportHtml])
  const reportDocumentUrl = useObjectUrl(reportDocumentResult.html, 'text/html')
  const hasReportError = isError || reportDocumentResult.error !== null || reportDocumentUrl.error !== null

  if (!hasReportError && (isLoading || (reportDocumentResult.html && !reportDocumentUrl.url))) {
    return (
      <Skeleton aria-label={t('detail.reportLoading')} className="h-[calc(100vh-16rem)] min-h-96 w-full rounded-2xl" />
    )
  }

  if (hasReportError || !reportDocumentUrl.url) {
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
      sandbox="allow-scripts"
      src={reportDocumentUrl.url}
      title={t('detail.reportFrameTitle')}
    />
  )
}
