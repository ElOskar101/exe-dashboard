import { describe, expect, it } from 'vitest'
import { isolateReportHtml, resolveExecutionReportBaseUrl } from './execution-report-html-utils'

describe('execution-report-panel helpers', () => {
  it('builds an absolute trailing-slash report base URL', () => {
    expect(resolveExecutionReportBaseUrl('/reports/exe-1', 'https://dashboard.test')).toBe(
      'https://dashboard.test/reports/exe-1/',
    )
  })

  it('injects a base tag and link navigation guard into a report head', () => {
    const reportBaseUrl = 'https://dashboard.test/reports/exe-1/'
    const html = isolateReportHtml('<html><head><title>Report</title></head><body></body></html>', reportBaseUrl)

    expect(html).toContain(`<base href="${reportBaseUrl}" />`)
    expect(html).toContain(`const reportBaseUrl = ${JSON.stringify(reportBaseUrl)}`)
    expect(html).toContain('const reportTheme = "light-mode"')
    expect(html).toContain('document.documentElement.classList.add(reportTheme)')
    expect(html).toContain('class ReportURL extends NativeURL')
    expect(html).toContain("const opaqueBaseSchemes = ['about:', 'blob:', 'data:']")
    expect(html).toContain('normalizedBase === window.location.href || hasOpaqueBaseScheme(normalizedBase)')
    expect(html).toContain('const resolveReportUrl = (value) => new URL(value, reportBaseUrl).toString()')
    expect(html).toContain("event.target.closest('a[href]')")
    expect(html).toContain("window.open(resolveReportUrl(href), '_blank', 'noopener,noreferrer')")
    expect(html).toContain("Object.defineProperty(window, 'localStorage'")
    expect(html).toContain("key === 'theme' ? reportStorageState.theme : target.getItem(key)")
  })

  it('maps the dashboard dark theme to Playwright report dark mode', () => {
    const html = isolateReportHtml(
      '<html><head></head><body></body></html>',
      'https://dashboard.test/reports/exe-1/',
      'dark',
    )

    expect(html).toContain('const reportTheme = "dark-mode"')
  })

  it('prepends the runtime shim when the report has no head tag', () => {
    const html = isolateReportHtml('<body>Report</body>', 'https://dashboard.test/reports/exe-1/')

    expect(html.trimStart().startsWith('<base href="https://dashboard.test/reports/exe-1/" />')).toBe(true)
  })

  it('keeps report assets from navigating inside the embedded frame', () => {
    const reportBaseUrl = 'https://dashboard.test/reports/exe-1/'
    const html = isolateReportHtml('<html><head></head><body></body></html>', reportBaseUrl)

    expect(html).toContain('event.preventDefault()')
    expect(html).toContain("window.open(resolveReportUrl(href), '_blank', 'noopener,noreferrer')")
  })
})
