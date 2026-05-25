import { createContext } from 'react'
import { IUser } from '../models/user.interface'

export interface IAuthContext {
  token: string
  // eslint-disable-next-line no-unused-vars
  saveToken: (token: string) => void
  clearToken: () => void
  logout: () => void
  isLoadingUser: boolean
  permissions: Record<string, boolean>
  user: IUser | null
}

export const AuthContext = createContext<IAuthContext>({
  saveToken: () => {},
  clearToken: () => {},
  logout: () => {},
  isLoadingUser: false,
  token: '',
  permissions: {},
  user: null,
})
