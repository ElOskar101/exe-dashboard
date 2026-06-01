import { io } from 'socket.io-client'
import { getAuthToken } from '@/features/auth/lib/auth-session'

export const socket = io(import.meta.env.VITE_SOCKET_URL, {
  autoConnect: false,
  auth: {
    token: getAuthToken(),
  },
  transports: ['websocket', 'polling'],
})
