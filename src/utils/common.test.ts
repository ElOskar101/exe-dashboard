import { describe, expect, it } from 'vitest'
import { _base64Decode, _base64Encode } from './common'

describe('base64 helpers', () => {
  it('decodes standard base64 values', () => {
    expect(_base64Decode(_base64Encode('token-123'))).toBe('token-123')
  })

  it('decodes url-safe base64 values without padding', () => {
    expect(_base64Decode('aHR0cHM6Ly9hZ2VudC5jb250cm9sY2VudHJhbGNhcnJpZXIuY29tLw')).toBe(
      'https://agent.controlcentralcarrier.com/',
    )
  })
})
