import { ReactElement, useContext } from 'react'
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

  return props.children
}
