import { createContext } from 'react'
import { IUser } from '../../interfaces/user.interface'

export interface IAuthContext {
  token: string
  // eslint-disable-next-line no-unused-vars
  saveToken: (token: string) => void
  clearToken: () => void
  logout: () => void
  permissions: Record<string, boolean>
  user: IUser | null
}

export const AuthContext = createContext<IAuthContext>({
  saveToken: () => {},
  clearToken: () => {},
  logout: () => {},
  token: '',
  permissions: {},
  user: null,
})
