import cccClient from '@/lib/axios'
import { IUser } from '../models/user.interface'

export const getUserData = () => {
  return cccClient<IUser>('users/me')
}
