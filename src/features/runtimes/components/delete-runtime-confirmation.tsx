import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { type PlaywrightRuntime, useDeletePlaywrightRuntimeMutation } from '@/features/executions'
import { IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getRuntimeMutationErrorMessage } from './runtime-dialog-helpers'
import { RuntimeActionTooltip, RuntimeActionTooltipTrigger } from './runtime-action-tooltip'

export function DeleteRuntimeConfirmation({
  runtime,
  triggerVariant = 'icon',
}: {
  runtime: PlaywrightRuntime
  triggerVariant?: 'icon' | 'menu-item'
}) {
  const { t } = useTranslation('runtimes')
  const [isOpen, setIsOpen] = useState(false)
  const deleteRuntimeMutation = useDeletePlaywrightRuntimeMutation()
  const isSubmitting = deleteRuntimeMutation.isPending
  const triggerLabel = t('deleteRuntime.trigger')

  const handleOpenChange = (open: boolean) => {
    if (isSubmitting && !open) {
      return
    }

    setIsOpen(open)
  }

  const handleDelete = async () => {
    try {
      await deleteRuntimeMutation.mutateAsync(runtime._id)
      toast.success(t('deleteRuntime.successTitle'), {
        description: t('deleteRuntime.successDescription', { runtime: runtime.name }),
      })
      setIsOpen(false)
    } catch (error) {
      toast.error(t('deleteRuntime.errorTitle'), {
        description: getRuntimeMutationErrorMessage(error, t('deleteRuntime.errorDescription')),
      })
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      {triggerVariant === 'menu-item' ? (
        <AlertDialogTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start rounded-2xl px-2.5 text-destructive hover:text-destructive"
            />
          }
        >
          <IconTrash data-icon="inline-start" />
          {triggerLabel}
        </AlertDialogTrigger>
      ) : (
        <RuntimeActionTooltip label={triggerLabel}>
          <AlertDialogTrigger
            render={<RuntimeActionTooltipTrigger icon={<IconTrash />} label={triggerLabel} variant="destructive" />}
          />
        </RuntimeActionTooltip>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteRuntime.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteRuntime.description', { runtime: runtime.name })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>{t('deleteRuntime.cancel')}</AlertDialogCancel>
          <Button type="button" variant="destructive" disabled={isSubmitting} onClick={() => void handleDelete()}>
            {isSubmitting ? <Spinner data-icon="inline-start" /> : <IconTrash data-icon="inline-start" />}
            {t('deleteRuntime.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
