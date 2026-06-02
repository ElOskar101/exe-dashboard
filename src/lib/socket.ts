import { io } from 'socket.io-client'
import { getSocketAuthPayload } from '@/features/auth/lib/auth-transport'

export const getSocketAuth = () => getSocketAuthPayload()

export const socket = io(import.meta.env.VITE_SOCKET_URL, {
  autoConnect: false,
  auth: getSocketAuth(),
  transports: ['websocket', 'polling'],
})
