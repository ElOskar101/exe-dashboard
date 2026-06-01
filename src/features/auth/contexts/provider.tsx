import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'
import { useMountEffect } from '@/hooks/use-mount-effect'
import { getUserData } from '../services/auth.service'
import { redirectToLogin } from '../utils/auth'
import { AuthContext } from './context'
import { IUser } from '../models/user.interface'
import {
  clearAuthToken,
  clearStoredUser,
  getAuthToken,
  getStoredUser,
  saveAuthToken,
  saveStoredUser,
} from '../lib/auth-session'

const getPermissions = (userData: IUser | null) => {
  const newPermissions: Record<string, boolean> = {}

  userData?.roles?.forEach((rol) => {
    newPermissions[rol.name] = true
    rol.permission?.forEach((p) => {
      newPermissions[p.name] = true
    })
  })

  return newPermissions
}

export const AuthProvider = (props: { children: ReactNode }) => {
  const { children } = props
  const initialToken = getAuthToken()
  const initialUser = getStoredUser()
  const [token, setToken] = useState(initialToken)
  const [permissions, setPermissions] = useState<Record<string, boolean>>(() => getPermissions(initialUser))
  const [user, setUser] = useState<IUser | null>(initialUser)
  const [isLoadingUser, setIsLoadingUser] = useState(() => Boolean(initialToken) && !initialUser)

  useMountEffect(() => {
    if (!token) {
      setIsLoadingUser(false)
      return
    }

    if (user) {
      setIsLoadingUser(false)
      return
    }

    setIsLoadingUser(true)

    getUserData()
      .then(({ data }) => {
        saveStoredUser(data)
        setUser(() => data)
        setPermissions(() => getPermissions(data))
      })
      .catch(() => {
        clearStoredUser()
        setUser(null)
        setPermissions({})
        redirectToLogin(window.location.origin)
      })
      .finally(() => {
        setIsLoadingUser(false)
      })
  })

  const saveToken = useCallback((newToken: string) => {
    saveAuthToken(newToken)
    setToken(newToken)
  }, [])

  const clearToken = useCallback(() => {
    clearAuthToken()
    clearStoredUser()
    setToken('')
    setUser(null)
    setPermissions({})
    setIsLoadingUser(false)
  }, [])

  const logout = () => {
    clearToken()
    redirectToLogin(window.location.origin)
  }

  return (
    <AuthContext.Provider value={{ token, saveToken, clearToken, logout, isLoadingUser, permissions, user }}>
      {children}
    </AuthContext.Provider>
  )
}
