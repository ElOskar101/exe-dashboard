import { useQueryClient } from '@tanstack/react-query'
import { useMountEffect } from '@/hooks/use-mount-effect'
import { socket } from '@/lib/socket'
import { updateExecutionStatus, type Execution } from '@/features/executions/shared'
import { shouldInvalidateExecutionsOnConnect } from '../lib/execution-status-updates'

interface ExecutionStatusPayload {
  executionId: string
  status: string
}

const EXECUTIONS_QUERY_KEY = ['executions'] as const

export const useExecutionStatusUpdates = () => {
  const queryClient = useQueryClient()
  const hadCachedExecutionsAtMount = Boolean(
    queryClient.getQueryState<Execution[]>(EXECUTIONS_QUERY_KEY)?.dataUpdatedAt,
  )

  useMountEffect(() => {
    let isInitialConnect = true

    const handleConnect = () => {
      const shouldInvalidate = shouldInvalidateExecutionsOnConnect({
        hadCachedExecutionsAtMount,
        isInitialConnect,
      })

      isInitialConnect = false

      if (!shouldInvalidate) {
        return
      }

      void queryClient.invalidateQueries({ queryKey: EXECUTIONS_QUERY_KEY })
    }

    const handleStatus = (payload: ExecutionStatusPayload) => {
      queryClient.setQueryData<Execution[]>(EXECUTIONS_QUERY_KEY, (executions) =>
        updateExecutionStatus(executions, payload.executionId, payload.status),
      )
    }

    socket.auth = {
      token: localStorage.getItem('token'),
    }

    socket.on('connect', handleConnect)
    socket.on('status', handleStatus)

    if (socket.connected) {
      handleConnect()
    } else {
      socket.connect()
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('status', handleStatus)
      socket.disconnect()
    }
  })
}
