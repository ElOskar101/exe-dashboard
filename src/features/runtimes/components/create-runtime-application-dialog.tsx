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
import {
  getPlaywrightRuntimeApplications,
  type PlaywrightRuntime,
  type PlaywrightRuntimeAccessType,
  type PlaywrightRuntimeApplicationPayload,
  useUpdatePlaywrightRuntimeMutation,
} from '@/features/executions'
import { IconPlus } from '@tabler/icons-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  createApplicationFormState,
  getCreateApplicationFormErrors,
  getRuntimeMutationErrorMessage,
  hasFormErrors,
  toCreateApplicationPayload,
  toHtmlIdSegment,
  toPlaywrightRuntimeApplicationPayload,
  toPlaywrightRuntimePayload,
  type ApplicationFormState,
} from './runtime-dialog-helpers'

interface DraftRuntimeApplicationDialogProps {
  draftRuntime: {
    accessType: PlaywrightRuntimeAccessType
    applications: readonly PlaywrightRuntimeApplicationPayload[]
    name: string
  }
  onCreateApplication: (application: PlaywrightRuntimeApplicationPayload) => void
}

interface PersistedRuntimeApplicationDialogProps {
  runtime: PlaywrightRuntime
}

type CreateRuntimeApplicationDialogProps = DraftRuntimeApplicationDialogProps | PersistedRuntimeApplicationDialogProps

const createDefaultApplicationFormState = (): ApplicationFormState =>
  createApplicationFormState({
    accessInfo: {
      sharedWith: [],
      type: 'private',
    },
    name: '',
  })

const createRuntimeApplicationsUpdatePayload = (
  runtime: PlaywrightRuntime,
  application: PlaywrightRuntimeApplicationPayload,
) =>
  toPlaywrightRuntimePayload(runtime, [
    ...getPlaywrightRuntimeApplications(runtime).map((item) => toPlaywrightRuntimeApplicationPayload(runtime, item)),
    application,
  ])

const isDraftRuntimeApplicationDialogProps = (
  props: CreateRuntimeApplicationDialogProps,
): props is DraftRuntimeApplicationDialogProps => 'draftRuntime' in props

const getDraftRuntimeName = (runtimeName: string, fallback: string) => runtimeName.trim() || fallback

export function CreateRuntimeApplicationDialog(props: CreateRuntimeApplicationDialogProps) {
  const { t } = useTranslation('runtimes')
  const [isOpen, setIsOpen] = useState(false)
  const [wasSubmitted, setWasSubmitted] = useState(false)
  const [formState, setFormState] = useState(createDefaultApplicationFormState)
  const updateRuntimeMutation = useUpdatePlaywrightRuntimeMutation()
  const isDraftMode = isDraftRuntimeApplicationDialogProps(props)
  const runtimeAccessType = isDraftMode ? props.draftRuntime.accessType : props.runtime.accessInfo.type
  const runtimeName = isDraftMode
    ? getDraftRuntimeName(props.draftRuntime.name, t('createRuntime.runtimeNameFallback'))
    : props.runtime.name
  const applications = isDraftMode ? props.draftRuntime.applications : getPlaywrightRuntimeApplications(props.runtime)
  const isPrivateRuntime = runtimeAccessType === 'private'
  const formErrors = getCreateApplicationFormErrors(runtimeAccessType, applications, formState)
  const showErrors = wasSubmitted
  const nameError = showErrors ? formErrors.name : undefined
  const accessTypeError = showErrors ? formErrors.accessType : undefined
  const maxWorkersError = showErrors ? formErrors.maxWorkers : undefined
  const maxRetriesError = showErrors ? formErrors.maxRetries : undefined
  const nameErrorMessage =
    nameError === 'required'
      ? t('createApp.errors.name.required')
      : nameError === 'duplicate'
        ? t('createApp.errors.name.duplicate')
        : undefined
  const accessTypeErrorMessage =
    accessTypeError === 'privateRuntime' ? t('createApp.errors.accessType.privateRuntime') : undefined
  const maxWorkersErrorMessage =
    maxWorkersError === 'positiveInteger' ? t('createApp.errors.maxWorkers.positiveInteger') : undefined
  const maxRetriesErrorMessage =
    maxRetriesError === 'nonNegativeInteger' ? t('createApp.errors.maxRetries.nonNegativeInteger') : undefined
  const isSubmitting = !isDraftMode && updateRuntimeMutation.isPending
  const fieldIdPrefix = isDraftMode
    ? `create-app-draft-${toHtmlIdSegment(runtimeName)}`
    : `create-app-${props.runtime._id}`

  const setFormValue = (value: Partial<ApplicationFormState>) => {
    setFormState((previousState) => ({
      ...previousState,
      ...value,
    }))
  }

  const resetForm = () => {
    setWasSubmitted(false)
    setFormState(createDefaultApplicationFormState())
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)

    if (!open) {
      resetForm()
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setWasSubmitted(true)

    if (hasFormErrors(formErrors)) {
      return
    }

    const application = toCreateApplicationPayload(formState, runtimeAccessType)

    if (isDraftMode) {
      props.onCreateApplication(application)
      handleOpenChange(false)

      return
    }

    try {
      await updateRuntimeMutation.mutateAsync({
        runtimeId: props.runtime._id,
        payload: createRuntimeApplicationsUpdatePayload(props.runtime, application),
      })
      toast.success(t('createApp.successTitle'), {
        description: t('createApp.successDescription', {
          app: application.name,
          runtime: props.runtime.name,
        }),
      })
      handleOpenChange(false)
    } catch (error) {
      toast.error(t('createApp.errorTitle'), {
        description: getRuntimeMutationErrorMessage(error, t('createApp.errorDescription')),
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" size="sm" variant="outline" className="shrink-0" />}>
        <IconPlus data-icon="inline-start" />
        {t('createApp.trigger')}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('createApp.title')}</DialogTitle>
          <DialogDescription>{t('createApp.description', { runtime: runtimeName })}</DialogDescription>
        </DialogHeader>

        <form className="flex min-h-0 flex-col gap-6" onSubmit={handleSubmit}>
          <div className="flex max-h-[min(65vh,34rem)] min-w-0 flex-col gap-5 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(nameError)} className="min-w-0">
                <FieldLabel htmlFor={`${fieldIdPrefix}-name`}>{t('createApp.fields.name')}</FieldLabel>
                <Input
                  id={`${fieldIdPrefix}-name`}
                  value={formState.name}
                  onChange={(event) => setFormValue({ name: event.target.value })}
                  aria-invalid={Boolean(nameError)}
                  autoComplete="off"
                  disabled={isSubmitting}
                  placeholder={t('createApp.placeholders.name')}
                />
                {nameErrorMessage ? <FieldError>{nameErrorMessage}</FieldError> : null}
              </Field>

              <Field className="min-w-0">
                <FieldLabel htmlFor={`${fieldIdPrefix}-api-url`}>{t('createApp.fields.apiUrl')}</FieldLabel>
                <Input
                  id={`${fieldIdPrefix}-api-url`}
                  value={formState.apiUrl}
                  onChange={(event) => setFormValue({ apiUrl: event.target.value })}
                  autoComplete="url"
                  disabled={isSubmitting}
                  placeholder={t('createApp.placeholders.apiUrl')}
                />
              </Field>
            </div>

            <Field className="min-w-0">
              <FieldLabel htmlFor={`${fieldIdPrefix}-description`}>{t('createApp.fields.description')}</FieldLabel>
              <Input
                id={`${fieldIdPrefix}-description`}
                value={formState.description}
                onChange={(event) => setFormValue({ description: event.target.value })}
                disabled={isSubmitting}
                placeholder={t('createApp.placeholders.description')}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(maxWorkersError)} className="min-w-0">
                <FieldLabel htmlFor={`${fieldIdPrefix}-max-workers`}>{t('createApp.fields.maxWorkers')}</FieldLabel>
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
                {maxWorkersErrorMessage ? <FieldError>{maxWorkersErrorMessage}</FieldError> : null}
              </Field>

              <Field data-invalid={Boolean(maxRetriesError)} className="min-w-0">
                <FieldLabel htmlFor={`${fieldIdPrefix}-max-retries`}>{t('createApp.fields.maxRetries')}</FieldLabel>
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
                {maxRetriesErrorMessage ? <FieldError>{maxRetriesErrorMessage}</FieldError> : null}
              </Field>
            </div>

            <Field data-invalid={Boolean(accessTypeError)}>
              <FieldLabel htmlFor={`${fieldIdPrefix}-access`}>{t('createApp.fields.access')}</FieldLabel>
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
                  <SelectValue placeholder={t('createApp.fields.access')}>
                    {t(`access.${isPrivateRuntime ? 'private' : formState.accessType}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value="private">{t('access.private')}</SelectItem>
                    <SelectItem value="public">{t('access.public')}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {isPrivateRuntime ? <FieldDescription>{t('createApp.privateRuntimeAccess')}</FieldDescription> : null}
              {accessTypeErrorMessage ? <FieldError>{accessTypeErrorMessage}</FieldError> : null}
            </Field>

            <FieldGroup className="gap-4">
              <Field orientation="horizontal">
                <Checkbox
                  id={`${fieldIdPrefix}-active`}
                  checked={formState.active}
                  onCheckedChange={(checked) => setFormValue({ active: checked === true })}
                  disabled={isSubmitting}
                />
                <FieldContent>
                  <FieldLabel htmlFor={`${fieldIdPrefix}-active`}>{t('createApp.fields.active')}</FieldLabel>
                  <FieldDescription>{t('createApp.activeDescription')}</FieldDescription>
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
                    {t('createApp.fields.nonProduction')}
                  </FieldLabel>
                  <FieldDescription>{t('createApp.nonProductionDescription')}</FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={isSubmitting} />}>
              {t('createApp.cancel')}
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner data-icon="inline-start" /> : <IconPlus data-icon="inline-start" />}
              {t('createApp.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
