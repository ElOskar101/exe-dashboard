import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  getPlaywrightRuntimeApplications,
  type PlaywrightRuntime,
  type PlaywrightRuntimeAccessType,
  type PlaywrightRuntimeApplication,
  type PlaywrightRuntimeApplicationPayload,
  type PlaywrightRuntimeUpdatePayload,
  usePlaywrightRuntimesQuery,
  useUpdatePlaywrightRuntimeMutation,
} from '@/features/executions'
import {
  IconAlertCircle,
  IconBox,
  IconDeviceDesktop,
  IconPlus,
  IconRefresh,
  IconShieldLock,
  IconShieldCheck,
} from '@tabler/icons-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const DESCRIPTION_PREVIEW_LENGTH = 20
const getConfiguredApplicationLimit = (value: number | undefined, fallback: number) => value ?? fallback
const objectIdPattern = /^[a-f\d]{24}$/i

interface CreateApplicationFormState {
  accessType: PlaywrightRuntimeAccessType
  active: boolean
  apiUrl: string
  description: string
  maxRetries: string
  maxWorkers: string
  name: string
  nonProduction: boolean
  sharedWith: string
}

interface CreateApplicationFormErrors {
  accessType?: 'privateRuntime'
  maxRetries?: 'nonNegativeInteger'
  maxWorkers?: 'positiveInteger'
  name?: 'duplicate' | 'required'
  sharedWith?: 'objectIds'
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
  sharedWith: '',
})

const normalizeOptionalString = (value: string | undefined) => {
  const trimmedValue = value?.trim()

  return trimmedValue || undefined
}

const parseSharedMemberIds = (value: string) =>
  value
    .split(/[\s,]+/)
    .map((memberId) => memberId.trim())
    .filter(Boolean)

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
    sharedWith: application.accessInfo.sharedWith?.length ? application.accessInfo.sharedWith : undefined,
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
  const sharedMemberIds = parseSharedMemberIds(formState.sharedWith)

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

  if (sharedMemberIds.some((memberId) => !objectIdPattern.test(memberId))) {
    errors.sharedWith = 'objectIds'
  }

  return errors
}

const hasFormErrors = (errors: CreateApplicationFormErrors) => Object.keys(errors).length > 0

const createRuntimeUpdatePayloadWithApplication = (
  runtime: PlaywrightRuntime,
  application: PlaywrightRuntimeApplicationPayload,
): PlaywrightRuntimeUpdatePayload => ({
  name: runtime.name,
  description: normalizeOptionalString(runtime.description),
  accessInfo: {
    type: runtime.accessInfo.type,
  },
  applications: [
    ...getPlaywrightRuntimeApplications(runtime).map((item) => toPlaywrightRuntimeApplicationPayload(runtime, item)),
    application,
  ],
})

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

function AccessBadge({ type }: { type: PlaywrightRuntime['accessInfo']['type'] }) {
  const { t } = useTranslation('runtimes')
  const AccessIcon = type === 'public' ? IconShieldCheck : IconShieldLock

  return (
    <Badge variant="outline" className="gap-1.5">
      <AccessIcon data-icon="inline-start" />
      {t(`access.${type}`)}
    </Badge>
  )
}

function RuntimesPageSkeleton() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48 rounded-2xl" />
        <Skeleton className="h-5 w-full max-w-xl rounded-2xl" />
      </div>
      <Skeleton className="h-96 rounded-4xl" />
    </div>
  )
}

export function RuntimesPage() {
  const { t } = useTranslation('runtimes')
  const runtimesQuery = usePlaywrightRuntimesQuery()

  if (runtimesQuery.isLoading) {
    return <RuntimesPageSkeleton />
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-normal">{t('page.title')}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">{t('page.description')}</p>
      </div>

      {runtimesQuery.isError ? (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertTitle>{t('loadErrorTitle')}</AlertTitle>
          <AlertDescription>{t('loadErrorDescription')}</AlertDescription>
          <Button
            className="mt-3 w-fit"
            size="sm"
            variant="outline"
            onClick={() => {
              void runtimesQuery.refetch()
            }}
          >
            <IconRefresh data-icon="inline-start" />
            {t('retry')}
          </Button>
        </Alert>
      ) : null}

      {!runtimesQuery.isError ? (
        <>
          {runtimesQuery.data?.length ? (
            <div className="flex flex-col gap-4">
              {runtimesQuery.data.map((runtime) => (
                <RuntimeCatalogCard key={runtime._id} runtime={runtime} />
              ))}
            </div>
          ) : (
            <Card size="sm">
              <CardHeader>
                <CardTitle>{t('empty.title')}</CardTitle>
                <CardDescription>{t('empty.description')}</CardDescription>
              </CardHeader>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}

function RuntimeCatalogCard({ runtime }: { runtime: PlaywrightRuntime }) {
  const { t } = useTranslation('runtimes')
  const applications = getPlaywrightRuntimeApplications(runtime)

  return (
    <Card size="default">
      <CardHeader className="gap-3">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <IconDeviceDesktop className="shrink-0" />
              <CardTitle>{runtime.name}</CardTitle>
              <AccessBadge type={runtime.accessInfo.type} />
            </div>
            <CardDescription>{runtime.description?.trim() || t('noDescription')}</CardDescription>
          </div>
          <CreateRuntimeApplicationDialog runtime={runtime} />
        </div>
      </CardHeader>
      <CardContent>
        <Table className="table-auto">
          <TableHeader>
            <TableRow>
              <TableHead>{t('columns.application')}</TableHead>
              <TableHead>{t('columns.status')}</TableHead>
              <TableHead>{t('columns.environment')}</TableHead>
              <TableHead>{t('columns.access')}</TableHead>
              <TableHead>{t('columns.config')}</TableHead>
              <TableHead>{t('columns.apiUrl')}</TableHead>
              <TableHead>{t('columns.description')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length > 0 ? (
              applications.map((application) => (
                <TableRow key={`${runtime._id}-${application.name}`}>
                  <TableCell className="whitespace-normal break-words text-white/80">
                    <span className="flex min-w-0 items-center gap-2">
                      <IconBox className="size-4 shrink-0 text-muted-foreground" />
                      <span>{application.name}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant="outline"
                        className={application.active === false ? 'text-destructive' : 'text-success'}
                      >
                        {application.active === false ? t('status.inactive') : t('status.active')}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/80">
                    {application.nonProduction ? t('environment.development') : t('environment.production')}
                  </TableCell>
                  <TableCell>
                    <AccessBadge type={application.accessInfo.type} />
                  </TableCell>
                  <TableCell>
                    <ul className="list-disc pl-4 text-xs text-white/80">
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
                  </TableCell>
                  <TableCell className="whitespace-normal break-all text-white/80">
                    {application.apiUrl?.trim() || t('noApiUrl')}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-white/80">
                    <ApplicationDescription description={application.description} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-white/80" colSpan={7}>
                  {t('runtimeSummary.emptyApplications')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function CreateRuntimeApplicationDialog({ runtime }: { runtime: PlaywrightRuntime }) {
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
  const sharedWithError = showErrors ? formErrors.sharedWith : undefined
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
  const sharedWithErrorMessage =
    sharedWithError === 'objectIds' ? t('createApp.errors.sharedWith.objectIds') : undefined
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

    const sharedMemberIds = parseSharedMemberIds(formState.sharedWith)
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
        sharedWith: sharedMemberIds.length > 0 ? sharedMemberIds : undefined,
      },
    }

    try {
      await updateRuntimeMutation.mutateAsync({
        runtimeId: runtime._id,
        payload: createRuntimeUpdatePayloadWithApplication(runtime, application),
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
          <FieldGroup className="max-h-[min(65vh,34rem)] gap-5 overflow-y-auto pr-1">
            <Field data-invalid={Boolean(nameError)}>
              <FieldLabel htmlFor={`${fieldIdPrefix}-name`}>{t('createApp.fields.name')}</FieldLabel>
              <Input
                id={`${fieldIdPrefix}-name`}
                value={formState.name}
                onChange={(event) => setFormValue({ name: event.target.value })}
                aria-invalid={Boolean(nameError)}
                autoComplete="off"
                disabled={isSubmitting}
              />
              {nameErrorMessage ? <FieldError>{nameErrorMessage}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor={`${fieldIdPrefix}-description`}>{t('createApp.fields.description')}</FieldLabel>
              <Input
                id={`${fieldIdPrefix}-description`}
                value={formState.description}
                onChange={(event) => setFormValue({ description: event.target.value })}
                disabled={isSubmitting}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor={`${fieldIdPrefix}-api-url`}>{t('createApp.fields.apiUrl')}</FieldLabel>
              <Input
                id={`${fieldIdPrefix}-api-url`}
                value={formState.apiUrl}
                onChange={(event) => setFormValue({ apiUrl: event.target.value })}
                autoComplete="url"
                disabled={isSubmitting}
              />
            </Field>

            <FieldGroup className="gap-4 sm:grid sm:grid-cols-2">
              <Field data-invalid={Boolean(maxWorkersError)}>
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

              <Field data-invalid={Boolean(maxRetriesError)}>
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
            </FieldGroup>

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

            <Field data-invalid={Boolean(sharedWithError)}>
              <FieldLabel htmlFor={`${fieldIdPrefix}-shared-with`}>{t('createApp.fields.sharedWith')}</FieldLabel>
              <textarea
                id={`${fieldIdPrefix}-shared-with`}
                value={formState.sharedWith}
                onChange={(event) => setFormValue({ sharedWith: event.target.value })}
                aria-invalid={Boolean(sharedWithError)}
                disabled={isSubmitting}
                className="min-h-24 w-full min-w-0 rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm transition-[color,box-shadow,background-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                spellCheck={false}
              />
              <FieldDescription>{t('createApp.sharedWithDescription')}</FieldDescription>
              {sharedWithErrorMessage ? <FieldError>{sharedWithErrorMessage}</FieldError> : null}
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
          </FieldGroup>

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

function ApplicationDescription({ description }: { description: string | undefined }) {
  const { t } = useTranslation('runtimes')
  const trimmedDescription = description?.trim()

  if (!trimmedDescription) {
    return t('noDescription')
  }

  if (trimmedDescription.length <= DESCRIPTION_PREVIEW_LENGTH) {
    return trimmedDescription
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <span className="truncate">{trimmedDescription.slice(0, DESCRIPTION_PREVIEW_LENGTH)}</span>
      <Popover>
        <PopoverTrigger
          render={
            <Button type="button" variant="link" className="h-auto px-0 py-0 text-muted-foreground">
              {t('descriptionMore')}
            </Button>
          }
        />
        <PopoverContent align="end" className="max-w-96 whitespace-normal break-words">
          {trimmedDescription}
        </PopoverContent>
      </Popover>
    </span>
  )
}
