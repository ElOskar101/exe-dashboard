import fetcher from '../api/axios.config'
import { IUser } from '../interfaces/user.interface'

export const getUserData = () => {
  return fetcher<IUser>('/users/me')
}
