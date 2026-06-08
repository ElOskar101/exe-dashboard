import type { ReactNode } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authKeys, getAndStoreUserData } from '../services/auth.service'
import { redirectToLogin } from '../utils/auth'
import { AuthContext } from './context'
import { IUser } from '../models/user.interface'
import { clearAuthToken, clearStoredUser, getAuthToken, getStoredUser, saveAuthToken } from '../lib/auth-session'

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
  const [token, setToken] = useState(getAuthToken)
  const [storedUser, setStoredUser] = useState<IUser | null>(getStoredUser)
  const userQuery = useQuery({
    queryKey: authKeys.currentUser(token),
    queryFn: getAndStoreUserData,
    enabled: Boolean(token) && !storedUser,
    retry: false,
    staleTime: Infinity,
  })
  const user = storedUser ?? userQuery.data ?? null
  const permissions = useMemo(() => getPermissions(user), [user])
  const isLoadingUser = Boolean(token) && !user && userQuery.isLoading

  const saveToken = useCallback((newToken: string) => {
    saveAuthToken(newToken)
    clearStoredUser()
    setToken(newToken)
    setStoredUser(null)
  }, [])

  const clearToken = useCallback(() => {
    clearAuthToken()
    clearStoredUser()
    setToken('')
    setStoredUser(null)
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
