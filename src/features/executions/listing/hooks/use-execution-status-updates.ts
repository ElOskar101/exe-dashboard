import { useQueryClient } from '@tanstack/react-query'
import { useMountEffect } from '@/hooks/use-mount-effect'
import {
  executionKeys,
  subscribeToExecutionStatus,
  syncExecutionStatusReadModelForTarget,
  useExecutionTarget,
  type Execution,
} from '@/features/executions/shared'
import { shouldInvalidateExecutionsOnConnect } from '../lib/execution-status-updates'

export const useExecutionStatusUpdates = () => {
  const queryClient = useQueryClient()
  const { target } = useExecutionTarget()
  const hadCachedExecutionsAtMount = Boolean(
    queryClient.getQueryState<Execution[]>(executionKeys.list(undefined, target.key))?.dataUpdatedAt,
  )

  useMountEffect(() => {
    if (target.type !== 'runtime-application') {
      return
    }

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

      void queryClient.invalidateQueries({ queryKey: executionKeys.list(undefined, target.key) })
    }

    const unsubscribe = subscribeToExecutionStatus({
      onConnect: handleConnect,
      onStatus: (payload) => {
        syncExecutionStatusReadModelForTarget(queryClient, payload.executionId, payload.status, target.key)
      },
      socketUrl: target.requestTarget.socketUrl,
    })

    return () => {
      unsubscribe()
    }
  })
}
