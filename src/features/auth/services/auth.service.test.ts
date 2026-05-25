import { describe, expect, it, vi, beforeEach } from 'vitest'
import cccClient from '@/lib/axios'
import { getUserData } from './auth.service'

vi.mock('@/lib/axios', () => ({
  default: vi.fn(),
}))

describe('auth.service', () => {
  beforeEach(() => {
    vi.mocked(cccClient).mockReset()
  })

  it('requests the current user from the API route', async () => {
    vi.mocked(cccClient).mockResolvedValueOnce({
      data: {
        username: 'operator',
      },
    })

    await getUserData()

    expect(cccClient).toHaveBeenCalledWith('users/me')
  })
})
