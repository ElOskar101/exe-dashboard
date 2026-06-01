import { useQueryClient } from '@tanstack/react-query'
import { useMountEffect } from '@/hooks/use-mount-effect'
import {
  executionKeys,
  subscribeToExecutionStatus,
  updateExecutionStatus,
  type Execution,
} from '@/features/executions/shared'
import { shouldInvalidateExecutionsOnConnect } from '../lib/execution-status-updates'

export const useExecutionStatusUpdates = () => {
  const queryClient = useQueryClient()
  const hadCachedExecutionsAtMount = Boolean(
    queryClient.getQueryState<Execution[]>(executionKeys.list())?.dataUpdatedAt,
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

      void queryClient.invalidateQueries({ queryKey: executionKeys.list() })
    }

    const unsubscribe = subscribeToExecutionStatus({
      onConnect: handleConnect,
      onStatus: (payload) => {
        queryClient.setQueryData<Execution[]>(executionKeys.list(), (executions) =>
          updateExecutionStatus(executions, payload.executionId, payload.status),
        )
      },
    })

    return () => {
      unsubscribe()
    }
  })
}
