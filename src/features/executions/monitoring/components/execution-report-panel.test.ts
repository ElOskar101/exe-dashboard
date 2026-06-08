import { describe, expect, it } from 'vitest'
import { isolateReportHtml, resolveExecutionReportBaseUrl } from './execution-report-html-utils'

describe('execution-report-panel helpers', () => {
  it('builds an absolute trailing-slash report base URL', () => {
    expect(resolveExecutionReportBaseUrl('/reports/exe-1', 'https://dashboard.test')).toBe(
      'https://dashboard.test/reports/exe-1/',
    )
  })

  it('injects a base tag and URL shim into a report head', () => {
    const reportBaseUrl = 'https://dashboard.test/reports/exe-1/'
    const html = isolateReportHtml('<html><head><title>Report</title></head><body></body></html>', reportBaseUrl)

    expect(html).toContain(`<base href="${reportBaseUrl}" />`)
    expect(html).toContain(`const reportBaseUrl = ${JSON.stringify(reportBaseUrl)}`)
    expect(html).toContain('class ReportURL extends NativeURL')
  })

  it('prepends the runtime shim when the report has no head tag', () => {
    const html = isolateReportHtml('<body>Report</body>', 'https://dashboard.test/reports/exe-1/')

    expect(html.trimStart().startsWith('<base href="https://dashboard.test/reports/exe-1/" />')).toBe(true)
  })
})
