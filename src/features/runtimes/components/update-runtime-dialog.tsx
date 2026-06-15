import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  type PlaywrightRuntime,
  type PlaywrightRuntimeAccessType,
  type PlaywrightRuntimeUpdatePayload,
  useAddPlaywrightRuntimeShareMembersMutation,
  useRemovePlaywrightRuntimeShareMembersMutation,
  useUpdatePlaywrightRuntimeMutation,
} from '@/features/executions'
import { IconPencil } from '@tabler/icons-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  createRuntimeFormState,
  getRuntimeFormErrors,
  getRuntimeMutationErrorMessage,
  getSharedMemberIds,
  hasFormErrors,
  normalizeOptionalString,
  type RuntimeFormState,
  toPlaywrightRuntimePayload,
} from './runtime-dialog-helpers'
import { RuntimeActionTooltip, RuntimeActionTooltipTrigger } from './runtime-action-tooltip'
import { ShareMembersField } from './share-members-field'

export function UpdateRuntimeDialog({ runtime }: { runtime: PlaywrightRuntime }) {
  const { t } = useTranslation('runtimes')
  const [isOpen, setIsOpen] = useState(false)
  const [wasSubmitted, setWasSubmitted] = useState(false)
  const [formState, setFormState] = useState(() => createRuntimeFormState(runtime))
  const [memberIds, setMemberIds] = useState(() => getSharedMemberIds(runtime.accessInfo))
  const [newMemberId, setNewMemberId] = useState('')
  const updateRuntimeMutation = useUpdatePlaywrightRuntimeMutation()
  const addShareMembersMutation = useAddPlaywrightRuntimeShareMembersMutation()
  const removeShareMembersMutation = useRemovePlaywrightRuntimeShareMembersMutation()
  const formErrors = getRuntimeFormErrors(formState)
  const nameError = wasSubmitted ? formErrors.name : undefined
  const isSubmitting =
    updateRuntimeMutation.isPending || addShareMembersMutation.isPending || removeShareMembersMutation.isPending
  const isShareTabDisabled = runtime.accessInfo.type === 'public'
  const fieldIdPrefix = `update-runtime-${runtime._id}`
  const triggerLabel = t('updateRuntime.trigger')

  const resetDialog = () => {
    setWasSubmitted(false)
    setFormState(createRuntimeFormState(runtime))
    setMemberIds(getSharedMemberIds(runtime.accessInfo))
    setNewMemberId('')
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)

    if (!open) {
      resetDialog()
    }
  }

  const setFormValue = (value: Partial<RuntimeFormState>) => {
    setFormState((previousState) => ({
      ...previousState,
      ...value,
    }))
  }

  const addMemberId = () => {
    const trimmedMemberId = newMemberId.trim()

    if (!trimmedMemberId) {
      return
    }

    setMemberIds((currentMemberIds) =>
      currentMemberIds.includes(trimmedMemberId) ? currentMemberIds : [...currentMemberIds, trimmedMemberId],
    )
    setNewMemberId('')
  }

  const removeMemberId = (memberId: string) => {
    setMemberIds((currentMemberIds) => currentMemberIds.filter((candidate) => candidate !== memberId))
  }

  const submitRuntimePayload = async (payload: PlaywrightRuntimeUpdatePayload, successDescription: string) => {
    try {
      await updateRuntimeMutation.mutateAsync({
        runtimeId: runtime._id,
        payload,
      })
      toast.success(t('updateRuntime.successTitle'), {
        description: successDescription,
      })
      handleOpenChange(false)
    } catch (error) {
      toast.error(t('updateRuntime.errorTitle'), {
        description: getRuntimeMutationErrorMessage(error, t('updateRuntime.errorDescription')),
      })
    }
  }

  const handleUpdateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setWasSubmitted(true)

    if (hasFormErrors(formErrors)) {
      return
    }

    await submitRuntimePayload(
      {
        ...toPlaywrightRuntimePayload(runtime),
        name: formState.name.trim(),
        description: normalizeOptionalString(formState.description),
        accessInfo: {
          type: formState.accessType,
          sharedWith: getSharedMemberIds(runtime.accessInfo),
        },
      },
      t('updateRuntime.successDescription', { runtime: formState.name.trim() }),
    )
  }

  const handleShareSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const currentMemberIds = getSharedMemberIds(runtime.accessInfo)
    const nextMemberIds = memberIds
    const currentMemberIdSet = new Set(currentMemberIds)
    const nextMemberIdSet = new Set(nextMemberIds)
    const memberIdsToAdd = nextMemberIds.filter((memberId) => !currentMemberIdSet.has(memberId))
    const memberIdsToRemove = currentMemberIds.filter((memberId) => !nextMemberIdSet.has(memberId))

    try {
      await Promise.all([
        memberIdsToAdd.length > 0
          ? addShareMembersMutation.mutateAsync({
              runtimeId: runtime._id,
              payload: { memberIds: memberIdsToAdd },
            })
          : Promise.resolve(),
        memberIdsToRemove.length > 0
          ? removeShareMembersMutation.mutateAsync({
              runtimeId: runtime._id,
              payload: { memberIds: memberIdsToRemove },
            })
          : Promise.resolve(),
      ])
      toast.success(t('updateRuntime.successTitle'), {
        description: t('share.runtimeSuccessDescription', { runtime: runtime.name }),
      })
      handleOpenChange(false)
    } catch (error) {
      toast.error(t('updateRuntime.errorTitle'), {
        description: getRuntimeMutationErrorMessage(error, t('updateRuntime.errorDescription')),
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <RuntimeActionTooltip label={triggerLabel}>
        <DialogTrigger
          render={<RuntimeActionTooltipTrigger icon={<IconPencil />} label={triggerLabel} variant="outline" />}
        />
      </RuntimeActionTooltip>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('updateRuntime.title')}</DialogTitle>
          <DialogDescription>{t('updateRuntime.description', { runtime: runtime.name })}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="update">
          <TabsList>
            <TabsTrigger value="update">{t('tabs.update')}</TabsTrigger>
            <TabsTrigger value="share" disabled={isShareTabDisabled}>
              {t('tabs.share')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="update">
            <form className="flex flex-col gap-6" onSubmit={handleUpdateSubmit}>
              <FieldGroup>
                <Field data-invalid={Boolean(nameError)}>
                  <FieldLabel htmlFor={`${fieldIdPrefix}-name`}>{t('updateRuntime.fields.name')}</FieldLabel>
                  <Input
                    id={`${fieldIdPrefix}-name`}
                    value={formState.name}
                    onChange={(event) => setFormValue({ name: event.target.value })}
                    aria-invalid={Boolean(nameError)}
                    disabled={isSubmitting}
                  />
                  {nameError ? <FieldError>{t('updateRuntime.errors.name.required')}</FieldError> : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor={`${fieldIdPrefix}-description`}>
                    {t('updateRuntime.fields.description')}
                  </FieldLabel>
                  <Input
                    id={`${fieldIdPrefix}-description`}
                    value={formState.description}
                    onChange={(event) => setFormValue({ description: event.target.value })}
                    disabled={isSubmitting}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor={`${fieldIdPrefix}-access`}>{t('updateRuntime.fields.access')}</FieldLabel>
                  <Select
                    value={formState.accessType}
                    onValueChange={(value) => setFormValue({ accessType: value as PlaywrightRuntimeAccessType })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id={`${fieldIdPrefix}-access`} className="w-full">
                      <SelectValue>{t(`access.${formState.accessType}`)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectGroup>
                        <SelectItem value="private">{t('access.private')}</SelectItem>
                        <SelectItem value="public">{t('access.public')}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>

              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" disabled={isSubmitting} />}>
                  {t('updateRuntime.cancel')}
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner data-icon="inline-start" /> : <IconPencil data-icon="inline-start" />}
                  {t('updateRuntime.submit')}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="share">
            <form className="flex flex-col gap-6" onSubmit={handleShareSubmit}>
              <ShareMembersField
                disabled={isSubmitting}
                id={`${fieldIdPrefix}-share-member-id`}
                memberIds={memberIds}
                newMemberId={newMemberId}
                onAdd={addMemberId}
                onChangeNewMemberId={setNewMemberId}
                onRemove={removeMemberId}
              />
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" disabled={isSubmitting} />}>
                  {t('updateRuntime.cancel')}
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner data-icon="inline-start" /> : <IconPencil data-icon="inline-start" />}
                  {t('share.submit')}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
