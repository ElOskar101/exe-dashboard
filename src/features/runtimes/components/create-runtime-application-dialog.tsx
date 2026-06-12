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
  type PlaywrightRuntimeAccessInfo,
  type PlaywrightRuntimeAccessPayload,
  type PlaywrightRuntimeAccessType,
  type PlaywrightRuntimeApplication,
  type PlaywrightRuntimeApplicationPayload,
  type PlaywrightRuntimeUpdatePayload,
  useUpdatePlaywrightRuntimeMutation,
} from '@/features/executions'
import { IconPlus } from '@tabler/icons-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

interface CreateApplicationFormState {
  accessType: PlaywrightRuntimeAccessType
  active: boolean
  apiUrl: string
  description: string
  maxRetries: string
  maxWorkers: string
  name: string
  nonProduction: boolean
}

interface CreateApplicationFormErrors {
  accessType?: 'privateRuntime'
  maxRetries?: 'nonNegativeInteger'
  maxWorkers?: 'positiveInteger'
  name?: 'duplicate' | 'required'
}

const createDefaultApplicationFormState = (): CreateApplicationFormState => ({
  accessType: 'private',
  active: true,
  apiUrl: '',
  description: '',
  maxRetries: '3',
  maxWorkers: '10',
  name: '',
  nonProduction: false,
})

const getConfiguredApplicationLimit = (value: number | undefined, fallback: number) => value ?? fallback

const normalizeOptionalString = (value: string | undefined) => {
  const trimmedValue = value?.trim()

  return trimmedValue || undefined
}

const parseIntegerField = (value: string) => {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return undefined
  }

  const parsedValue = Number(trimmedValue)

  return Number.isInteger(parsedValue) ? parsedValue : undefined
}

const toPlaywrightRuntimeApplicationPayload = (
  runtime: PlaywrightRuntime,
  application: PlaywrightRuntimeApplication,
): PlaywrightRuntimeApplicationPayload => ({
  name: application.name,
  active: application.active ?? true,
  nonProduction: application.nonProduction ?? false,
  description: normalizeOptionalString(application.description),
  apiUrl: normalizeOptionalString(application.apiUrl),
  config: {
    maxWorkers: getConfiguredApplicationLimit(application.config?.maxWorkers, 10),
    maxRetries: getConfiguredApplicationLimit(application.config?.maxRetries, 3),
  },
  accessInfo: {
    type: runtime.accessInfo.type === 'private' ? 'private' : application.accessInfo.type,
  },
})

const getCreateApplicationFormErrors = (
  runtime: PlaywrightRuntime,
  formState: CreateApplicationFormState,
  applications: readonly PlaywrightRuntimeApplication[],
) => {
  const errors: CreateApplicationFormErrors = {}
  const name = formState.name.trim()
  const maxWorkers = parseIntegerField(formState.maxWorkers)
  const maxRetries = parseIntegerField(formState.maxRetries)

  if (!name) {
    errors.name = 'required'
  } else if (applications.some((application) => application.name.trim().toLowerCase() === name.toLowerCase())) {
    errors.name = 'duplicate'
  }

  if (maxWorkers === undefined || maxWorkers < 1) {
    errors.maxWorkers = 'positiveInteger'
  }

  if (maxRetries === undefined || maxRetries < 0) {
    errors.maxRetries = 'nonNegativeInteger'
  }

  if (runtime.accessInfo.type === 'private' && formState.accessType === 'public') {
    errors.accessType = 'privateRuntime'
  }

  return errors
}

const hasFormErrors = (errors: CreateApplicationFormErrors) => Object.keys(errors).length > 0

const toPlaywrightRuntimeAccessPayload = (accessInfo: PlaywrightRuntimeAccessInfo): PlaywrightRuntimeAccessPayload => ({
  type: accessInfo.type,
  sharedWith: accessInfo.sharedWith,
})

const toPlaywrightRuntimePayload = (
  runtime: PlaywrightRuntime,
  applications: PlaywrightRuntimeApplicationPayload[],
): PlaywrightRuntimeUpdatePayload => ({
  name: runtime.name,
  description: runtime.description,
  accessInfo: toPlaywrightRuntimeAccessPayload(runtime.accessInfo),
  applications,
})

const createRuntimeApplicationsUpdatePayload = (
  runtime: PlaywrightRuntime,
  application: PlaywrightRuntimeApplicationPayload,
): PlaywrightRuntimeUpdatePayload =>
  toPlaywrightRuntimePayload(runtime, [
    ...getPlaywrightRuntimeApplications(runtime).map((item) => toPlaywrightRuntimeApplicationPayload(runtime, item)),
    application,
  ])

const getRuntimeMutationErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = error.response as { data?: { message?: string } } | undefined
    const message = response?.data?.message?.trim()

    if (message) {
      return message
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function CreateRuntimeApplicationDialog({ runtime }: { runtime: PlaywrightRuntime }) {
  const { t } = useTranslation('runtimes')
  const [isOpen, setIsOpen] = useState(false)
  const [wasSubmitted, setWasSubmitted] = useState(false)
  const [formState, setFormState] = useState(createDefaultApplicationFormState)
  const updateRuntimeMutation = useUpdatePlaywrightRuntimeMutation()
  const applications = getPlaywrightRuntimeApplications(runtime)
  const isPrivateRuntime = runtime.accessInfo.type === 'private'
  const formErrors = getCreateApplicationFormErrors(runtime, formState, applications)
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
  const isSubmitting = updateRuntimeMutation.isPending
  const fieldIdPrefix = `create-app-${runtime._id}`

  const setFormValue = (value: Partial<CreateApplicationFormState>) => {
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

    const applicationAccessType = isPrivateRuntime ? 'private' : formState.accessType
    const application: PlaywrightRuntimeApplicationPayload = {
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
      },
    }

    try {
      await updateRuntimeMutation.mutateAsync({
        runtimeId: runtime._id,
        payload: createRuntimeApplicationsUpdatePayload(runtime, application),
      })
      toast.success(t('createApp.successTitle'), {
        description: t('createApp.successDescription', {
          app: application.name,
          runtime: runtime.name,
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
          <DialogDescription>{t('createApp.description', { runtime: runtime.name })}</DialogDescription>
        </DialogHeader>

        <form className="flex min-h-0 flex-col gap-6" onSubmit={handleSubmit}>
          <div className="flex max-h-[min(65vh,34rem)] min-w-0 flex-col gap-5 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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
