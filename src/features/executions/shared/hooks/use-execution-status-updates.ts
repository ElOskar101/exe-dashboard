import { useQueryClient } from '@tanstack/react-query'
import { useMountEffect } from '@/hooks/use-mount-effect'
import { executionKeys } from '../lib/execution-query-keys'
import { subscribeToExecutionStatus } from '../lib/execution-realtime'
import { syncExecutionStatusReadModelForTarget } from '../lib/execution-status-cache'
import { shouldInvalidateExecutionsOnConnect } from '../lib/execution-status-updates'
import type { Execution } from '../model/execution'
import { useExecutionTarget } from './use-execution-target'

export const useExecutionStatusUpdates = () => {
  const queryClient = useQueryClient()
  const { target } = useExecutionTarget()
  const hadCachedExecutionsAtMount = Boolean(
    queryClient.getQueryState<Execution[]>(executionKeys.list(undefined, target.key))?.dataUpdatedAt,
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

      void queryClient.invalidateQueries({ queryKey: executionKeys.list(undefined, target.key) })
    }

    const unsubscribe = subscribeToExecutionStatus({
      onConnect: handleConnect,
      onStatus: (payload) => {
        syncExecutionStatusReadModelForTarget(queryClient, payload.executionId, payload.status, target.key, {
          observedAt: payload.timestamp,
          source: 'realtime',
        })
      },
      socketUrl: target.requestTarget.socketUrl,
    })

    return () => {
      unsubscribe()
    }
  })
}
