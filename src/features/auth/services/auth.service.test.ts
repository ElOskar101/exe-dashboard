import { describe, expect, it, vi, beforeEach } from 'vitest'
import cccClient from '@/lib/axios'
import { saveStoredUser } from '../lib/auth-session'
import { authKeys, getAndStoreUserData, getUserData } from './auth.service'

vi.mock('@/lib/axios', () => ({
  default: vi.fn(),
}))

vi.mock('../lib/auth-session', () => ({
  saveStoredUser: vi.fn(),
}))

describe('auth.service', () => {
  const cccApiUrl = 'https://dev-carrier.dentalautomation.ai'

  beforeEach(() => {
    vi.mocked(cccClient).mockReset()
    vi.mocked(saveStoredUser).mockReset()
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

  it('stores and returns the current user data after loading it', async () => {
    const user = {
      username: 'operator',
    }

    vi.mocked(cccClient).mockResolvedValueOnce({
      data: user,
    })

    const result = await getAndStoreUserData(cccApiUrl)

    expect(result).toBe(user)
    expect(saveStoredUser).toHaveBeenCalledWith(user, cccApiUrl)
  })

  it('builds the current user query key from the token and CCC API URL', () => {
    expect(authKeys.currentUser('token-123', cccApiUrl)).toEqual(['auth', 'current-user', 'token-123', cccApiUrl])
  })
})
