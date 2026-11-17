import axios from 'axios'
import type { CccApiUrl } from '@/app.config'
import cccClient from '@/lib/axios'
import { IUser } from '../models/user.interface'
import { saveStoredUser } from '../lib/auth-session'
import { getAuthRequestHeaders } from '../lib/auth-transport'

export const authKeys = {
  currentUser: (token: string, cccApiUrl: string) => ['auth', 'current-user', token, cccApiUrl] as const,
}

export const getUserData = () => {
  return cccClient<IUser>('users/me')
}

export const getAndStoreUserData = async (cccApiUrl: string) => {
  const response = await getUserData()

  saveStoredUser(response.data, cccApiUrl)

  return response.data
}

/** Sends one request to `cccApiUrl` and rejects with its error. Never clears the session or redirects to login. */
export const verifyCccApiSession = (cccApiUrl: CccApiUrl) =>
  axios.get<IUser>(`${cccApiUrl}/api/users/me`, {
    adapter: 'fetch',
    headers: getAuthRequestHeaders(),
  })
