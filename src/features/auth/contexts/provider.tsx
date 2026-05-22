import { ReactElement, useCallback, useState } from 'react'
import { useMountEffect } from '@/hooks/use-mount-effect'
import { _base64Decode, _base64Encode } from '@/utils/common'
import { getUserData } from '../services/auth.service'
import { redirectToLogin } from '../utils/auth'
import { AuthContext } from './context'
import { IUser } from '../models/user.interface'

export const AuthProvider = (props: { children: ReactElement }) => {
  const { children } = props
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [user, setUser] = useState<IUser | null>(null)

  useMountEffect(() => {
    const savedUserData = sessionStorage.getItem('me')
    if (savedUserData) {
      const user: IUser = JSON.parse(_base64Decode(savedUserData))
      setPermissions(() => getPermissions(user))
      setUser(() => user)
    } else {
      getUserData().then(({ data }) => {
        sessionStorage.setItem('me', _base64Encode(JSON.stringify(data)))
        setUser(() => data)
        setPermissions(() => getPermissions(data))
      })
    }
  })

  const getPermissions = (userData: IUser) => {
    const newPermissions: Record<string, boolean> = {}

    userData.roles?.forEach((rol) => {
      newPermissions[rol.name] = true
      rol.permission?.forEach((p) => {
        newPermissions[p.name] = true
      })
    })

    return newPermissions
  }

  const saveToken = useCallback((newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }, [])

  const clearToken = useCallback(() => {
    localStorage.removeItem('token')
    setToken('')
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('permissions')
    redirectToLogin(window.location.origin)
  }

  return (
    <AuthContext.Provider
      value={{ token, saveToken, clearToken, logout, permissions, user }}
    >
      {children}
    </AuthContext.Provider>
  )
}
