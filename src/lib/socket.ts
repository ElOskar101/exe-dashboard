import { io } from 'socket.io-client'
import { getAuthToken } from '@/features/auth/lib/auth-session'

export const getSocketAuth = () => {
  const token = getAuthToken()

  return token ? { token } : {}
}

export const socket = io(import.meta.env.VITE_SOCKET_URL, {
  autoConnect: false,
  auth: getSocketAuth(),
  transports: ['websocket', 'polling'],
})
