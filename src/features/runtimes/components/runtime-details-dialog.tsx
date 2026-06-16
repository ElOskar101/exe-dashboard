import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getPlaywrightRuntimeApplications, type PlaywrightRuntime } from '@/features/executions'
import { IconUserCircle } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AccessBadge, CreatorBadge } from './runtime-badges'

interface RuntimeDetailsDialogProps {
  children?: ReactNode
  runtime: PlaywrightRuntime
}

export function RuntimeDetailsDialog({ children, runtime }: RuntimeDetailsDialogProps) {
  const { t } = useTranslation('runtimes')
  const applications = getPlaywrightRuntimeApplications(runtime)

  return (
    <Dialog>
      {children}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('runtimeDetails.title')}</DialogTitle>
          <DialogDescription>{t('runtimeDetails.description', { runtime: runtime.name })}</DialogDescription>
        </DialogHeader>

        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <DetailItem label={t('runtimeDetails.fields.name')} value={runtime.name} />
          <DetailItem
            label={t('runtimeDetails.fields.description')}
            value={runtime.description?.trim() || t('noDescription')}
          />
          <DetailItem
            label={t('runtimeDetails.fields.access')}
            value={<AccessBadge type={runtime.accessInfo.type} />}
          />
          <DetailItem
            label={t('runtimeDetails.fields.creator')}
            value={<CreatorBadge creator={runtime.accessInfo.createdBy} />}
          />
          <DetailItem label={t('runtimeDetails.fields.applications')} value={applications.length} />
          <DetailItem
            label={t('runtimeDetails.fields.sharedWith')}
            value={<SharedMembersList members={runtime.accessInfo.sharedWith} />}
          />
        </dl>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>{t('close')}</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailItem({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt>{label}</dt>
      <dd className="mt-1 whitespace-normal break-words font-medium text-muted-foreground">{value}</dd>
    </div>
  )
}

function SharedMembersList({ members }: { members: PlaywrightRuntime['accessInfo']['sharedWith'] }) {
  const { t } = useTranslation('runtimes')

  if (members.length === 0) {
    return <span className="font-medium text-muted-foreground">{t('share.empty')}</span>
  }

  return (
    <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
      {members.map((member) => (
        <li key={member._id} className="flex items-center gap-1.5">
          <IconUserCircle className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{member.fullName || member.username || member._id}</span>
        </li>
      ))}
    </ul>
  )
}
