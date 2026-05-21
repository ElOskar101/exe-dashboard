import fetcher from '@/lib/axios'
import { IUser } from '../model/user.interface'

export const getUserData = () => {
  return fetcher<IUser>('/users/me')
}
