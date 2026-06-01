import { ReactElement, useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { getAuthToken } from '../lib/auth-session'
import { AuthContext } from '../contexts/context'
import { redirectToLogin } from '../utils/auth'

const ProtectedRouteLoading = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div role="status" aria-live="polite" aria-busy="true" className="text-sm text-muted-foreground">
        Checking access...
      </div>
    </div>
  )
}

export const ProtectedRoute = (props: { children: ReactElement }) => {
  const token = getAuthToken()
  const authContext = useContext(AuthContext)
  const noPermission = Object.keys(authContext.permissions || {}).length > 0 && !authContext.permissions['admin']

  if (!token) {
    redirectToLogin()
    return null
  }

  if (authContext.isLoadingUser) {
    return <ProtectedRouteLoading />
  }

  if (!authContext.user) {
    redirectToLogin()
    return null
  }

  if (noPermission) {
    return <Navigate to="/under-construction" />
  }

  return props.children
}
