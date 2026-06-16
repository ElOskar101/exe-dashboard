import cccClient from '@/lib/axios'
import { IUser } from '../models/user.interface'
import { saveStoredUser } from '../lib/auth-session'

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
