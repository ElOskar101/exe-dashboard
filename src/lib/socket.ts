import { io, type Socket } from 'socket.io-client'
import { getSocketAuthPayload } from '@/features/auth/lib/auth-transport'

export const getSocketAuth = () => getSocketAuthPayload()

const sockets = new Map<string, Socket>()

export const getDefaultSocketUrl = () => import.meta.env.VITE_SOCKET_URL

export const getExecutionSocket = (socketUrl = getDefaultSocketUrl()) => {
  const existingSocket = sockets.get(socketUrl)

  if (existingSocket) {
    return existingSocket
  }

  const socket = io(socketUrl, {
    autoConnect: false,
    auth: getSocketAuth(),
    transports: ['websocket', 'polling'],
  })

  sockets.set(socketUrl, socket)

  return socket
}

export const socket = getExecutionSocket()
