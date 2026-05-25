import { describe, expect, it } from 'vitest'
import cccClient, { ensurePathSuffix, exeClient, exeReportsClient, stripTrailingSlash } from './axios'

describe('axios URL helpers', () => {
  it('strips trailing slashes from configured URLs', () => {
    expect(stripTrailingSlash('https://carrier.dentalautomation.ai///')).toBe('https://carrier.dentalautomation.ai')
  })

  it('adds the api suffix when the base URL points to the host root', () => {
    expect(ensurePathSuffix('https://dev-carrier.dentalautomation.ai/', '/api')).toBe(
      'https://dev-carrier.dentalautomation.ai/api',
    )
  })

  it('does not duplicate the api suffix when it is already present', () => {
    expect(ensurePathSuffix('https://carrier.dentalautomation.ai/api', '/api')).toBe(
      'https://carrier.dentalautomation.ai/api',
    )
  })

  it('uses the configured dev Carrier API URL for the CCC client', () => {
    expect(cccClient.defaults.baseURL).toBe('https://dev-carrier.dentalautomation.ai/api')
  })

  it('uses the configured EXE API URL for the EXE client', () => {
    expect(exeClient.defaults.baseURL).toBe('/execution-api')
  })

  it('uses the configured reports proxy URL for the reports client', () => {
    expect(exeReportsClient.defaults.baseURL).toBe('/execution-reports')
  })
})
