import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  getPlaywrightRuntimeApplications,
  type PlaywrightRuntime,
  type PlaywrightRuntimeAccessType,
  type PlaywrightRuntimeApplication,
  type PlaywrightRuntimeApplicationPayload,
  useUpdatePlaywrightRuntimeMutation,
} from '@/features/executions'
import { IconPencil } from '@tabler/icons-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  createApplicationFormState,
  getApplicationFormErrors,
  getRuntimeMutationErrorMessage,
  getSharedMemberIds,
  hasFormErrors,
  normalizeOptionalString,
  parseIntegerField,
  toHtmlIdSegment,
  toPlaywrightRuntimeApplicationPayload,
  toPlaywrightRuntimePayload,
  type ApplicationFormState,
} from './runtime-dialog-helpers'
import { RuntimeActionTooltip, RuntimeActionTooltipTrigger } from './runtime-action-tooltip'
import { ShareMembersField } from './share-members-field'

export function UpdateAppDialog({
  application,
  runtime,
}: {
  application: PlaywrightRuntimeApplication
  runtime: PlaywrightRuntime
}) {
  const { t } = useTranslation('runtimes')
  const [isOpen, setIsOpen] = useState(false)
  const [wasSubmitted, setWasSubmitted] = useState(false)
  const [formState, setFormState] = useState(() => createApplicationFormState(application))
  const [memberIds, setMemberIds] = useState(() => getSharedMemberIds(application.accessInfo))
  const updateRuntimeMutation = useUpdatePlaywrightRuntimeMutation()
  const isPrivateRuntime = runtime.accessInfo.type === 'private'
  const formErrors = getApplicationFormErrors(runtime, application, formState)
  const showErrors = wasSubmitted
  const nameError = showErrors ? formErrors.name : undefined
  const accessTypeError = showErrors ? formErrors.accessType : undefined
  const maxWorkersError = showErrors ? formErrors.maxWorkers : undefined
  const maxRetriesError = showErrors ? formErrors.maxRetries : undefined
  const isSubmitting = updateRuntimeMutation.isPending
  const isShareTabDisabled = runtime.accessInfo.type === 'public' || application.accessInfo.type === 'public'
  const shareTabDisabledReason = t('share.disabled.publicRuntimeOrApp')
  const fieldIdPrefix = `update-app-${toHtmlIdSegment(runtime._id)}-${toHtmlIdSegment(application.name)}`
  const triggerLabel = t('updateApp.trigger')

  const resetDialog = () => {
    setWasSubmitted(false)
    setFormState(createApplicationFormState(application))
    setMemberIds(getSharedMemberIds(application.accessInfo))
  }

  const handleOpenChange = (open: boolean) => {
    resetDialog()
    setIsOpen(open)
  }

  const setFormValue = (value: Partial<ApplicationFormState>) => {
    setFormState((previousState) => ({
      ...previousState,
      ...value,
    }))
  }

  const addMemberId = (memberId: string) => {
    const trimmedMemberId = memberId.trim()

    if (!trimmedMemberId) {
      return
    }

    setMemberIds((currentMemberIds) =>
      currentMemberIds.includes(trimmedMemberId) ? currentMemberIds : [...currentMemberIds, trimmedMemberId],
    )
  }

  const removeMemberId = (memberId: string) => {
    setMemberIds((currentMemberIds) => currentMemberIds.filter((candidate) => candidate !== memberId))
  }

  const updateApplication = async (
    updatedApplication: PlaywrightRuntimeApplicationPayload,
    successDescription: string,
  ) => {
    const applications = getPlaywrightRuntimeApplications(runtime).map((candidate) =>
      candidate.name === application.name
        ? updatedApplication
        : toPlaywrightRuntimeApplicationPayload(runtime, candidate),
    )

    try {
      await updateRuntimeMutation.mutateAsync({
        runtimeId: runtime._id,
        payload: toPlaywrightRuntimePayload(runtime, applications),
      })
      toast.success(t('updateApp.successTitle'), {
        description: successDescription,
      })
      handleOpenChange(false)
    } catch (error) {
      toast.error(t('updateApp.errorTitle'), {
        description: getRuntimeMutationErrorMessage(error, t('updateApp.errorDescription')),
      })
    }
  }

  const handleUpdateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setWasSubmitted(true)

    if (hasFormErrors(formErrors)) {
      return
    }

    const applicationAccessType = isPrivateRuntime ? 'private' : formState.accessType

    await updateApplication(
      {
        name: formState.name.trim(),
        active: formState.active,
        nonProduction: formState.nonProduction,
        description: normalizeOptionalString(formState.description),
        apiUrl: normalizeOptionalString(formState.apiUrl),
        config: {
          maxWorkers: parseIntegerField(formState.maxWorkers) ?? 10,
          maxRetries: parseIntegerField(formState.maxRetries) ?? 3,
        },
        accessInfo: {
          type: applicationAccessType,
          sharedWith: memberIds,
        },
      },
      t('updateApp.successDescription', { app: formState.name.trim() }),
    )
  }

  const handleShareSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await updateApplication(
      {
        ...toPlaywrightRuntimeApplicationPayload(runtime, application),
        accessInfo: {
          type: isPrivateRuntime ? 'private' : application.accessInfo.type,
          sharedWith: memberIds,
        },
      },
      t('share.appSuccessDescription', { app: application.name }),
    )
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
          <DialogTitle>{t('updateApp.title')}</DialogTitle>
          <DialogDescription>{t('updateApp.description', { app: application.name })}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="update">
          <TabsList>
            <TabsTrigger value="update">{t('tabs.update')}</TabsTrigger>
            {isShareTabDisabled ? (
              <Tooltip>
                <TooltipTrigger nativeButton={false} render={<span className="inline-flex cursor-not-allowed" />}>
                  <TabsTrigger value="share" disabled>
                    {t('tabs.share')}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>{shareTabDisabledReason}</TooltipContent>
              </Tooltip>
            ) : (
              <TabsTrigger value="share">{t('tabs.share')}</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="update">
            <form
              className="flex max-h-[min(65vh,34rem)] flex-col gap-6 overflow-y-auto pr-1"
              onSubmit={handleUpdateSubmit}
            >
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field data-invalid={Boolean(nameError)}>
                    <FieldLabel htmlFor={`${fieldIdPrefix}-name`}>{t('updateApp.fields.name')}</FieldLabel>
                    <Input
                      id={`${fieldIdPrefix}-name`}
                      value={formState.name}
                      onChange={(event) => setFormValue({ name: event.target.value })}
                      aria-invalid={Boolean(nameError)}
                      disabled={isSubmitting}
                    />
                    {nameError === 'required' ? <FieldError>{t('updateApp.errors.name.required')}</FieldError> : null}
                    {nameError === 'duplicate' ? <FieldError>{t('updateApp.errors.name.duplicate')}</FieldError> : null}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`${fieldIdPrefix}-api-url`}>{t('updateApp.fields.apiUrl')}</FieldLabel>
                    <Input
                      id={`${fieldIdPrefix}-api-url`}
                      value={formState.apiUrl}
                      onChange={(event) => setFormValue({ apiUrl: event.target.value })}
                      disabled={isSubmitting}
                      autoComplete="url"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor={`${fieldIdPrefix}-description`}>{t('updateApp.fields.description')}</FieldLabel>
                  <Input
                    id={`${fieldIdPrefix}-description`}
                    value={formState.description}
                    onChange={(event) => setFormValue({ description: event.target.value })}
                    disabled={isSubmitting}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field data-invalid={Boolean(maxWorkersError)}>
                    <FieldLabel htmlFor={`${fieldIdPrefix}-max-workers`}>{t('updateApp.fields.maxWorkers')}</FieldLabel>
                    <Input
                      id={`${fieldIdPrefix}-max-workers`}
                      value={formState.maxWorkers}
                      onChange={(event) => setFormValue({ maxWorkers: event.target.value })}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      aria-invalid={Boolean(maxWorkersError)}
                      disabled={isSubmitting}
                    />
                    {maxWorkersError ? (
                      <FieldError>{t('updateApp.errors.maxWorkers.positiveInteger')}</FieldError>
                    ) : null}
                  </Field>

                  <Field data-invalid={Boolean(maxRetriesError)}>
                    <FieldLabel htmlFor={`${fieldIdPrefix}-max-retries`}>{t('updateApp.fields.maxRetries')}</FieldLabel>
                    <Input
                      id={`${fieldIdPrefix}-max-retries`}
                      value={formState.maxRetries}
                      onChange={(event) => setFormValue({ maxRetries: event.target.value })}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      aria-invalid={Boolean(maxRetriesError)}
                      disabled={isSubmitting}
                    />
                    {maxRetriesError ? (
                      <FieldError>{t('updateApp.errors.maxRetries.nonNegativeInteger')}</FieldError>
                    ) : null}
                  </Field>

                  <Field data-invalid={Boolean(accessTypeError)}>
                    <FieldLabel htmlFor={`${fieldIdPrefix}-access`}>{t('updateApp.fields.access')}</FieldLabel>
                    <Select
                      value={isPrivateRuntime ? 'private' : formState.accessType}
                      onValueChange={(value) => setFormValue({ accessType: value as PlaywrightRuntimeAccessType })}
                      disabled={isSubmitting || isPrivateRuntime}
                    >
                      <SelectTrigger
                        id={`${fieldIdPrefix}-access`}
                        className="w-full"
                        aria-invalid={Boolean(accessTypeError)}
                      >
                        <SelectValue>{t(`access.${isPrivateRuntime ? 'private' : formState.accessType}`)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectGroup>
                          <SelectItem value="private">{t('access.private')}</SelectItem>
                          <SelectItem value="public">{t('access.public')}</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {isPrivateRuntime ? (
                      <FieldDescription>{t('updateApp.privateRuntimeAccess')}</FieldDescription>
                    ) : null}
                    {accessTypeError ? (
                      <FieldError>{t('updateApp.errors.accessType.privateRuntime')}</FieldError>
                    ) : null}
                  </Field>
                </div>

                <FieldGroup className="gap-4">
                  <Field orientation="horizontal">
                    <Checkbox
                      id={`${fieldIdPrefix}-active`}
                      checked={formState.active}
                      onCheckedChange={(checked) => setFormValue({ active: checked === true })}
                      disabled={isSubmitting}
                    />
                    <FieldContent>
                      <FieldLabel htmlFor={`${fieldIdPrefix}-active`}>{t('updateApp.fields.active')}</FieldLabel>
                      <FieldDescription>{t('updateApp.activeDescription')}</FieldDescription>
                    </FieldContent>
                  </Field>

                  <Field orientation="horizontal">
                    <Checkbox
                      id={`${fieldIdPrefix}-non-production`}
                      checked={formState.nonProduction}
                      onCheckedChange={(checked) => setFormValue({ nonProduction: checked === true })}
                      disabled={isSubmitting}
                    />
                    <FieldContent>
                      <FieldLabel htmlFor={`${fieldIdPrefix}-non-production`}>
                        {t('updateApp.fields.nonProduction')}
                      </FieldLabel>
                      <FieldDescription>{t('updateApp.nonProductionDescription')}</FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldGroup>
              </FieldGroup>

              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" disabled={isSubmitting} />}>
                  {t('updateApp.cancel')}
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner data-icon="inline-start" /> : <IconPencil data-icon="inline-start" />}
                  {t('updateApp.submit')}
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
                onAdd={addMemberId}
                onRemove={removeMemberId}
              />
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" disabled={isSubmitting} />}>
                  {t('updateApp.cancel')}
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
