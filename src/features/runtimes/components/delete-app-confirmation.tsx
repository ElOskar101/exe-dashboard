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
import {
  getPlaywrightRuntimeApplications,
  type PlaywrightRuntime,
  type PlaywrightRuntimeApplication,
  useUpdatePlaywrightRuntimeMutation,
} from '@/features/executions'
import { IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  getRuntimeMutationErrorMessage,
  toPlaywrightRuntimeApplicationPayload,
  toPlaywrightRuntimePayload,
} from './runtime-dialog-helpers'
import { RuntimeActionTooltip, RuntimeActionTooltipTrigger } from './runtime-action-tooltip'

export function DeleteAppConfirmation({
  application,
  runtime,
  triggerVariant = 'icon',
}: {
  application: PlaywrightRuntimeApplication
  runtime: PlaywrightRuntime
  triggerVariant?: 'icon' | 'menu-item'
}) {
  const { t } = useTranslation('runtimes')
  const [isOpen, setIsOpen] = useState(false)
  const updateRuntimeMutation = useUpdatePlaywrightRuntimeMutation()
  const isSubmitting = updateRuntimeMutation.isPending
  const triggerLabel = t('deleteApp.trigger')

  const handleOpenChange = (open: boolean) => {
    if (isSubmitting && !open) {
      return
    }

    setIsOpen(open)
  }

  const handleDelete = async () => {
    const applications = getPlaywrightRuntimeApplications(runtime)
      .filter((candidate) => candidate.name !== application.name)
      .map((candidate) => toPlaywrightRuntimeApplicationPayload(runtime, candidate))

    try {
      await updateRuntimeMutation.mutateAsync({
        runtimeId: runtime._id,
        payload: toPlaywrightRuntimePayload(runtime, applications),
      })
      toast.success(t('deleteApp.successTitle'), {
        description: t('deleteApp.successDescription', { app: application.name }),
      })
      setIsOpen(false)
    } catch (error) {
      toast.error(t('deleteApp.errorTitle'), {
        description: getRuntimeMutationErrorMessage(error, t('deleteApp.errorDescription')),
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
          <AlertDialogTitle>{t('deleteApp.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteApp.description', { app: application.name })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>{t('deleteApp.cancel')}</AlertDialogCancel>
          <Button type="button" variant="destructive" disabled={isSubmitting} onClick={() => void handleDelete()}>
            {isSubmitting ? <Spinner data-icon="inline-start" /> : <IconTrash data-icon="inline-start" />}
            {t('deleteApp.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
