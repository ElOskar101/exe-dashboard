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
import { SidebarMenuAction } from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { IconTrash } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

interface ExecutionSidebarDeleteDialogProps {
  executionLabel: string
  isDeleting: boolean
  isMobileActionVisible: boolean
  isOpen: boolean
  onDelete: () => void
  onOpenChange: (open: boolean) => void
}

export function ExecutionSidebarDeleteDialog({
  executionLabel,
  isDeleting,
  isMobileActionVisible,
  isOpen,
  onDelete,
  onOpenChange,
}: ExecutionSidebarDeleteDialogProps) {
  const { t } = useTranslation('executions')

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogTrigger
        render={
          <SidebarMenuAction
            className={cn(
              'right-2 !top-1/2 !-translate-y-1/2 hover:bg-sidebar-accent/60',
              !isMobileActionVisible &&
                'opacity-0 hover:opacity-100 aria-expanded:opacity-100 peer-hover/menu-button:opacity-100',
            )}
            aria-label={t('sidebar.deleteAction', {
              execution: executionLabel,
            })}
            disabled={isDeleting}
          >
            <IconTrash />
          </SidebarMenuAction>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('sidebar.deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('sidebar.deleteDescription', {
              execution: executionLabel,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t('sidebar.cancelDelete')}</AlertDialogCancel>
          <Button variant="destructive" disabled={isDeleting} onClick={onDelete}>
            {isDeleting ? <Spinner data-icon="inline-start" /> : null}
            {isDeleting ? t('sidebar.deleting') : t('sidebar.confirmDelete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
