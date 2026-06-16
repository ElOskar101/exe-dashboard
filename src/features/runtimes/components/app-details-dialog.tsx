import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { type PlaywrightRuntime, type PlaywrightRuntimeApplication } from '@/features/executions'
import { IconUserCircle } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AccessBadge, CreatorBadge } from './runtime-badges'
import { getConfiguredApplicationLimit } from './runtime-dialog-helpers'

interface AppDetailsDialogProps {
  application: PlaywrightRuntimeApplication
  children?: ReactNode
  runtime: PlaywrightRuntime
}

export function AppDetailsDialog({ application, children, runtime }: AppDetailsDialogProps) {
  const { t } = useTranslation('runtimes')
  const isActive = application.active !== false

  return (
    <Dialog>
      {children}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('appDetails.title')}</DialogTitle>
          <DialogDescription>
            {t('appDetails.description', { app: application.name, runtime: runtime.name })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailItem label={t('appDetails.fields.name')} value={application.name} />
          <DetailItem
            label={t('appDetails.fields.status')}
            value={
              <Badge variant="outline" className={isActive ? 'text-success' : 'text-destructive'}>
                {isActive ? t('status.active') : t('status.inactive')}
              </Badge>
            }
          />
          <DetailItem
            label={t('appDetails.fields.environment')}
            value={application.nonProduction ? t('environment.development') : t('environment.production')}
          />
          <DetailItem
            label={t('appDetails.fields.access')}
            value={<AccessBadge type={application.accessInfo.type} />}
          />
          <DetailItem
            label={t('appDetails.fields.creator')}
            value={<CreatorBadge creator={application.accessInfo.createdBy} />}
          />
          <DetailItem
            label={t('appDetails.fields.config')}
            value={
              <ul className="list-disc pl-4 text-sm text-foreground">
                <li>
                  {t('config.maxWorkers', {
                    count: getConfiguredApplicationLimit(application.config?.maxWorkers, 10),
                  })}
                </li>
                <li>
                  {t('config.maxRetries', {
                    count: getConfiguredApplicationLimit(application.config?.maxRetries, 3),
                  })}
                </li>
              </ul>
            }
          />
          <DetailItem label={t('appDetails.fields.apiUrl')} value={application.apiUrl?.trim() || t('noApiUrl')} />
          <DetailItem
            label={t('appDetails.fields.description')}
            value={application.description?.trim() || t('noDescription')}
          />
          <DetailItem
            label={t('appDetails.fields.sharedWith')}
            value={<SharedMembersList members={application.accessInfo.sharedWith} />}
            className="sm:col-span-2"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DetailItem({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="break-words text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  )
}

function SharedMembersList({ members }: { members: PlaywrightRuntimeApplication['accessInfo']['sharedWith'] }) {
  const { t } = useTranslation('runtimes')

  if (members.length === 0) {
    return <span className="text-sm text-muted-foreground">{t('share.empty')}</span>
  }

  return (
    <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
      {members.map((member) => (
        <li key={member._id} className="flex items-center gap-1.5 text-sm text-foreground">
          <IconUserCircle className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{member.fullName || member.username || member._id}</span>
        </li>
      ))}
    </ul>
  )
}
