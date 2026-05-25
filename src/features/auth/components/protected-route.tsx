import { ReactElement, useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../contexts/context'
import { redirectToLogin } from '../utils/auth'

export const ProtectedRoute = (props: { children: ReactElement }) => {
  const token = localStorage.getItem('token')
  const authContext = useContext(AuthContext)
  const noPermission = Object.keys(authContext.permissions || {}).length > 0 && !authContext.permissions['admin']

  if (!token) {
    redirectToLogin()
  }

  if (noPermission) {
    return <Navigate to="/under-construction" />
  }

  return props.children
}
