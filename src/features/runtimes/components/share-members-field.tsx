import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { IconPlus, IconX } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

export function ShareMembersField({
  disabled,
  id,
  memberIds,
  newMemberId,
  onAdd,
  onChangeNewMemberId,
  onRemove,
}: {
  disabled: boolean
  id: string
  memberIds: string[]
  newMemberId: string
  onAdd: () => void
  onChangeNewMemberId: (value: string) => void
  onRemove: (memberId: string) => void
}) {
  const { t } = useTranslation('runtimes')

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={id}>{t('share.fields.memberId')}</FieldLabel>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={id}
            value={newMemberId}
            onChange={(event) => onChangeNewMemberId(event.target.value)}
            placeholder={t('share.placeholders.memberId')}
            disabled={disabled}
            autoComplete="off"
          />
          <Button type="button" variant="outline" onClick={onAdd} disabled={disabled || !newMemberId.trim()}>
            <IconPlus data-icon="inline-start" />
            {t('share.add')}
          </Button>
        </div>
        <FieldDescription>{t('share.description')}</FieldDescription>
      </Field>

      {memberIds.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {memberIds.map((memberId) => (
            <Badge key={memberId} variant="secondary" className="gap-1">
              <span className="max-w-56 truncate">{memberId}</span>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={() => onRemove(memberId)}
                disabled={disabled}
                aria-label={t('share.removeLabel', { memberId })}
              >
                <IconX />
              </Button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('share.empty')}</p>
      )}
    </FieldGroup>
  )
}
