import { Badge } from '@/components/ui/badge'
import { type PlaywrightRuntime } from '@/features/executions'
import { IconShieldCheck, IconShieldLock, IconUserCircle } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { getPlaywrightRuntimeCreatorLabel } from './runtime-dialog-helpers'

export function AccessBadge({ type }: { type: PlaywrightRuntime['accessInfo']['type'] }) {
  const { t } = useTranslation('runtimes')
  const AccessIcon = type === 'public' ? IconShieldCheck : IconShieldLock

  return (
    <Badge variant="outline" className="gap-1.5">
      <AccessIcon data-icon="inline-start" />
      {t(`access.${type}`)}
    </Badge>
  )
}

export function CreatorBadge({ creator }: { creator: PlaywrightRuntime['accessInfo']['createdBy'] }) {
  const { t } = useTranslation('runtimes')
  const creatorLabel = getPlaywrightRuntimeCreatorLabel(creator)

  return (
    <Badge variant="outline" className="max-w-full gap-1.5">
      <IconUserCircle data-icon="inline-start" />
      <span className="min-w-0 truncate">{creatorLabel ?? t('creator.unknown')}</span>
    </Badge>
  )
}
