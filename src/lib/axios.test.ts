import { describe, expect, it } from 'vitest'
import { ensurePathSuffix, stripTrailingSlash } from './axios'

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
})
