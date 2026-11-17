import { describe, expect, it, vi, beforeEach } from 'vitest'
import axios from 'axios'
import cccClient from '@/lib/axios'
import { saveStoredUser } from '../lib/auth-session'
import { authKeys, getAndStoreUserData, getUserData, verifyCccApiSession } from './auth.service'

vi.mock('@/lib/axios', () => ({
  default: vi.fn(),
}))

vi.mock('axios', () => ({
  default: { get: vi.fn() },
}))

vi.mock('../lib/auth-session', () => ({
  saveStoredUser: vi.fn(),
}))

vi.mock('../lib/auth-transport', () => ({
  getAuthRequestHeaders: () => ({ 'x-access-token': 'token-123' }),
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

  describe('verifyCccApiSession', () => {
    const targetApiUrl = 'https://carriers.dentalautomation.ai'

    beforeEach(() => {
      vi.mocked(axios.get).mockReset()
    })

    it('asks the target API for the current user with the session token', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: { username: 'operator' } })

      await verifyCccApiSession(targetApiUrl)

      expect(axios.get).toHaveBeenCalledWith(`${targetApiUrl}/api/users/me`, {
        adapter: 'fetch',
        headers: { 'x-access-token': 'token-123' },
      })
    })

    it('does not use the shared CCC client, so a rejection never ends the session', async () => {
      vi.mocked(axios.get).mockRejectedValueOnce(
        Object.assign(new Error('Unauthorized'), { response: { status: 401 } }),
      )

      await expect(verifyCccApiSession(targetApiUrl)).rejects.toThrow('Unauthorized')
      expect(cccClient).not.toHaveBeenCalled()
    })
  })
})
