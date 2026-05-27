import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'
import { useMountEffect } from '@/hooks/use-mount-effect'
import { _base64Decode, _base64Encode } from '@/utils/common'
import { getUserData } from '../services/auth.service'
import { userSchema } from '../models/user.interface'
import { redirectToLogin } from '../utils/auth'
import { AuthContext } from './context'
import { IUser } from '../models/user.interface'

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

const getStoredUser = () => {
  const savedUserData = sessionStorage.getItem('me')

  if (!savedUserData) {
    return null
  }

  try {
    const parsedUser = userSchema.safeParse(JSON.parse(_base64Decode(savedUserData)))

    if (parsedUser.success) {
      return parsedUser.data
    }

    sessionStorage.removeItem('me')
    return null
  } catch {
    sessionStorage.removeItem('me')
    return null
  }
}

export const AuthProvider = (props: { children: ReactNode }) => {
  const { children } = props
  const initialToken = localStorage.getItem('token') || ''
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
        sessionStorage.setItem('me', _base64Encode(JSON.stringify(data)))
        setUser(() => data)
        setPermissions(() => getPermissions(data))
      })
      .catch(() => {
        sessionStorage.removeItem('me')
        setUser(null)
        setPermissions({})
        redirectToLogin(window.location.origin)
      })
      .finally(() => {
        setIsLoadingUser(false)
      })
  })

  const saveToken = useCallback((newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }, [])

  const clearToken = useCallback(() => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('me')
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
