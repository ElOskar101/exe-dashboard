import cccClient from '@/lib/axios'
import { IUser } from '../models/user.interface'
import { saveStoredUser } from '../lib/auth-session'

export const authKeys = {
  currentUser: (token: string) => ['auth', 'current-user', token] as const,
}

export const getUserData = () => {
  return cccClient<IUser>('users/me')
}

export const getAndStoreUserData = async () => {
  const response = await getUserData()

  saveStoredUser(response.data)

  return response.data
}
