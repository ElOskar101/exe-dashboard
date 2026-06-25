import { useRef, useState } from 'react'
import { useMountEffect } from '@/hooks/use-mount-effect'

const MIN_REFRESH_SPIN_DURATION_MS = 1000

export const useExecutionsSidebarRefresh = ({
  isFetching,
  refetch,
}: {
  isFetching: boolean
  refetch: () => Promise<unknown>
}) => {
  const [isRefreshSpinning, setIsRefreshSpinning] = useState(false)
  const refreshSpinnerTimeoutId = useRef<number | null>(null)

  useMountEffect(() => {
    return () => {
      if (refreshSpinnerTimeoutId.current !== null) {
        window.clearTimeout(refreshSpinnerTimeoutId.current)
      }
    }
  })

  const handleRefresh = async () => {
    if (isFetching || isRefreshSpinning) {
      return
    }

    const refreshStartedAt = Date.now()
    setIsRefreshSpinning(true)

    try {
      await refetch()
    } finally {
      const elapsed = Date.now() - refreshStartedAt
      const remainingDuration = Math.max(MIN_REFRESH_SPIN_DURATION_MS - elapsed, 0)

      if (refreshSpinnerTimeoutId.current !== null) {
        window.clearTimeout(refreshSpinnerTimeoutId.current)
      }

      refreshSpinnerTimeoutId.current = window.setTimeout(() => {
        refreshSpinnerTimeoutId.current = null
        setIsRefreshSpinning(false)
      }, remainingDuration)
    }
  }

  return {
    handleRefresh,
    isRefreshSpinning,
  }
}
