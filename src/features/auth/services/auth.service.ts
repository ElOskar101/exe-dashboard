import fetcher from '@/lib/axios'
import { IUser } from '../models/user.interface'

export const getUserData = () => {
  return fetcher<IUser>('/users/me')
}
