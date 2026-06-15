import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Spinner } from '@/components/ui/spinner'
import { type PlaywrightRuntime, useDeletePlaywrightRuntimeMutation } from '@/features/executions'
import { IconTrash } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getRuntimeMutationErrorMessage } from './runtime-dialog-helpers'
import { RuntimeActionTooltip, RuntimeActionTooltipTrigger } from './runtime-action-tooltip'

export function DeleteRuntimeConfirmation({ runtime }: { runtime: PlaywrightRuntime }) {
  const { t } = useTranslation('runtimes')
  const deleteRuntimeMutation = useDeletePlaywrightRuntimeMutation()
  const isSubmitting = deleteRuntimeMutation.isPending
  const triggerLabel = t('deleteRuntime.trigger')

  const handleDelete = async () => {
    try {
      await deleteRuntimeMutation.mutateAsync(runtime._id)
      toast.success(t('deleteRuntime.successTitle'), {
        description: t('deleteRuntime.successDescription', { runtime: runtime.name }),
      })
    } catch (error) {
      toast.error(t('deleteRuntime.errorTitle'), {
        description: getRuntimeMutationErrorMessage(error, t('deleteRuntime.errorDescription')),
      })
    }
  }

  return (
    <AlertDialog>
      <RuntimeActionTooltip label={triggerLabel}>
        <AlertDialogTrigger
          render={<RuntimeActionTooltipTrigger icon={<IconTrash />} label={triggerLabel} variant="destructive" />}
        />
      </RuntimeActionTooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteRuntime.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteRuntime.description', { runtime: runtime.name })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>{t('deleteRuntime.cancel')}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isSubmitting} onClick={() => void handleDelete()}>
            {isSubmitting ? <Spinner data-icon="inline-start" /> : <IconTrash data-icon="inline-start" />}
            {t('deleteRuntime.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
