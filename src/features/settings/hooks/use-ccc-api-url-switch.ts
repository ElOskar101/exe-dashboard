import { useMutation } from '@tanstack/react-query'
import type { CccApiUrl } from '@/app.config'
import { verifyCccApiSession } from '@/features/auth'
import { useCccApiUrl } from '@/hooks/use-ccc-api-url'
import { isCccApiUrl } from '@/lib/ccc-api-url'

export const useCccApiUrlSwitch = () => {
  const { cccApiUrl, setCccApiUrl } = useCccApiUrl()
  const switchMutation = useMutation({
    mutationFn: async (nextApiUrl: CccApiUrl) => {
      await verifyCccApiSession(nextApiUrl)
      return nextApiUrl
    },
    onSuccess: setCccApiUrl,
  })

  const switchCccApiUrl = (nextApiUrl: string | null) => {
    if (!isCccApiUrl(nextApiUrl) || nextApiUrl === cccApiUrl) {
      return
    }

    switchMutation.mutate(nextApiUrl)
  }

  return {
    cccApiUrl,
    switchCccApiUrl,
    isSwitching: switchMutation.isPending,
    rejectedApiUrl: switchMutation.isError ? switchMutation.variables : null,
  }
}
