import { ReactElement, useContext, useEffect, useState } from 'react'
import { redirectToLogin } from '../utils/auth.ts'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/auth-context/context.tsx'

export const ProtectedRoute = (props: { children: ReactElement }) => {
  const token = localStorage.getItem('token')
  const authContext = useContext(AuthContext)
  const [noPermission, setNoPermission] = useState(false)

  useEffect(() => {
    if (
      Object.keys(authContext.permissions || {}).length > 0 &&
      !authContext.permissions['admin']
    )
      setNoPermission(true)
  }, [authContext.permissions])

  if (!token) {
    redirectToLogin()
  }

  if (noPermission) {
    return <Navigate to="/under-construction" />
  }

  return props.children
}
