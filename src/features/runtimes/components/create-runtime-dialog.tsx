import { Badge } from '@/components/ui/badge'
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
  type PlaywrightRuntimeAccessType,
  type PlaywrightRuntimeApplicationPayload,
  useCreatePlaywrightRuntimeMutation,
} from '@/features/executions'
import { IconBox, IconPlus, IconX } from '@tabler/icons-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CreateRuntimeApplicationDialog } from './create-runtime-application-dialog'
import {
  getConfiguredApplicationLimit,
  getRuntimeFormErrors,
  getRuntimeMutationErrorMessage,
  hasFormErrors,
  normalizeOptionalString,
  type RuntimeFormState,
} from './runtime-dialog-helpers'

const createDefaultRuntimeFormState = (): RuntimeFormState => ({
  accessType: 'private',
  description: '',
  name: '',
})

const normalizeApplicationsForRuntimeAccessType = (
  applications: readonly PlaywrightRuntimeApplicationPayload[],
  accessType: PlaywrightRuntimeAccessType,
): PlaywrightRuntimeApplicationPayload[] =>
  accessType === 'private'
    ? applications.map((application) => ({
        ...application,
        accessInfo: {
          ...application.accessInfo,
          type: 'private' as const,
        },
      }))
    : [...applications]

export function CreateRuntimeDialog() {
  const { t } = useTranslation('runtimes')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState('runtime')
  const [wasSubmitted, setWasSubmitted] = useState(false)
  const [formState, setFormState] = useState(createDefaultRuntimeFormState)
  const [applications, setApplications] = useState<PlaywrightRuntimeApplicationPayload[]>([])
  const createRuntimeMutation = useCreatePlaywrightRuntimeMutation()
  const formErrors = getRuntimeFormErrors(formState)
  const nameError = wasSubmitted ? formErrors.name : undefined
  const applicationsError = wasSubmitted && applications.length === 0 ? 'required' : undefined
  const isSubmitting = createRuntimeMutation.isPending
  const fieldIdPrefix = 'create-runtime'

  const setFormValue = (value: Partial<RuntimeFormState>) => {
    setFormState((previousState) => ({
      ...previousState,
      ...value,
    }))
  }

  const handleAccessTypeChange = (value: PlaywrightRuntimeAccessType) => {
    setFormValue({ accessType: value })
    setApplications((currentApplications) => normalizeApplicationsForRuntimeAccessType(currentApplications, value))
  }

  const resetForm = () => {
    setSelectedTab('runtime')
    setWasSubmitted(false)
    setFormState(createDefaultRuntimeFormState())
    setApplications([])
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)

    if (!open) {
      resetForm()
    }
  }

  const addApplication = (application: PlaywrightRuntimeApplicationPayload) => {
    setApplications((currentApplications) => [...currentApplications, application])
    toast.success(t('createRuntime.apps.addedTitle'), {
      description: t('createRuntime.apps.addedDescription', { app: application.name }),
    })
  }

  const removeApplication = (applicationName: string) => {
    setApplications((currentApplications) =>
      currentApplications.filter((application) => application.name !== applicationName),
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setWasSubmitted(true)

    if (hasFormErrors(formErrors) || applications.length === 0) {
      setSelectedTab(formErrors.name ? 'runtime' : 'apps')

      return
    }

    try {
      await createRuntimeMutation.mutateAsync({
        name: formState.name.trim(),
        description: normalizeOptionalString(formState.description),
        accessInfo: {
          type: formState.accessType,
        },
        applications: normalizeApplicationsForRuntimeAccessType(applications, formState.accessType),
      })
      toast.success(t('createRuntime.successTitle'), {
        description: t('createRuntime.successDescription', { runtime: formState.name.trim() }),
      })
      handleOpenChange(false)
    } catch (error) {
      toast.error(t('createRuntime.errorTitle'), {
        description: getRuntimeMutationErrorMessage(error, t('createRuntime.errorDescription')),
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" />}>
        <IconPlus data-icon="inline-start" />
        {t('createRuntime.trigger')}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('createRuntime.title')}</DialogTitle>
          <DialogDescription>{t('createRuntime.description')}</DialogDescription>
        </DialogHeader>

        <form className="flex min-h-0 flex-col gap-6" onSubmit={handleSubmit}>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="min-h-0">
            <TabsList>
              <TabsTrigger value="runtime">{t('createRuntime.tabs.runtime')}</TabsTrigger>
              <TabsTrigger value="apps">{t('createRuntime.tabs.apps')}</TabsTrigger>
            </TabsList>

            <TabsContent value="runtime">
              <FieldGroup>
                <Field data-invalid={Boolean(nameError)}>
                  <FieldLabel htmlFor={`${fieldIdPrefix}-name`}>{t('createRuntime.fields.name')}</FieldLabel>
                  <Input
                    id={`${fieldIdPrefix}-name`}
                    value={formState.name}
                    onChange={(event) => setFormValue({ name: event.target.value })}
                    aria-invalid={Boolean(nameError)}
                    autoComplete="off"
                    disabled={isSubmitting}
                    placeholder={t('createRuntime.placeholders.name')}
                  />
                  {nameError ? <FieldError>{t('createRuntime.errors.name.required')}</FieldError> : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor={`${fieldIdPrefix}-description`}>
                    {t('createRuntime.fields.description')}
                  </FieldLabel>
                  <Input
                    id={`${fieldIdPrefix}-description`}
                    value={formState.description}
                    onChange={(event) => setFormValue({ description: event.target.value })}
                    disabled={isSubmitting}
                    placeholder={t('createRuntime.placeholders.description')}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor={`${fieldIdPrefix}-access`}>{t('createRuntime.fields.access')}</FieldLabel>
                  <Select
                    value={formState.accessType}
                    onValueChange={(value) => handleAccessTypeChange(value as PlaywrightRuntimeAccessType)}
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
            </TabsContent>

            <TabsContent value="apps" className="min-h-0">
              <div className="flex min-h-0 flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-sm font-medium">{t('createRuntime.apps.title')}</p>
                    <p className="text-sm text-muted-foreground">{t('createRuntime.apps.description')}</p>
                  </div>

                  <CreateRuntimeApplicationDialog
                    draftRuntime={{
                      accessType: formState.accessType,
                      applications,
                      name: formState.name,
                    }}
                    onCreateApplication={addApplication}
                  />
                </div>

                {applications.length > 0 ? (
                  <div className="flex max-h-[min(40vh,22rem)] flex-col gap-3 overflow-y-auto pr-1">
                    {applications.map((application) => (
                      <DraftRuntimeApplicationCard
                        key={application.name}
                        application={application}
                        onRemove={removeApplication}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                    {t('createRuntime.apps.empty')}
                  </div>
                )}

                {applicationsError ? <FieldError>{t('createRuntime.errors.applications.required')}</FieldError> : null}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={isSubmitting} />}>
              {t('createRuntime.cancel')}
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner data-icon="inline-start" /> : <IconPlus data-icon="inline-start" />}
              {t('createRuntime.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DraftRuntimeApplicationCard({
  application,
  onRemove,
}: {
  application: PlaywrightRuntimeApplicationPayload
  onRemove: (applicationName: string) => void
}) {
  const { t } = useTranslation('runtimes')
  const isActive = application.active !== false

  return (
    <div className="rounded-2xl border px-4 py-3">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <IconBox className="size-4 shrink-0 text-muted-foreground" />
            <p className="font-medium">{application.name}</p>
            <Badge variant="outline">{t(`access.${application.accessInfo.type}`)}</Badge>
            <Badge variant="outline" className={isActive ? 'text-success' : 'text-destructive'}>
              {isActive ? t('status.active') : t('status.inactive')}
            </Badge>
            <Badge variant="outline">
              {application.nonProduction ? t('environment.development') : t('environment.production')}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">{application.description?.trim() || t('noDescription')}</p>
          <div className="flex min-w-0 flex-col gap-1 text-sm text-muted-foreground">
            <span className="break-all">{application.apiUrl?.trim() || t('noApiUrl')}</span>
            <span>
              {t('config.maxWorkers', {
                count: getConfiguredApplicationLimit(application.config?.maxWorkers, 10),
              })}
              {' · '}
              {t('config.maxRetries', {
                count: getConfiguredApplicationLimit(application.config?.maxRetries, 3),
              })}
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="self-end sm:self-start"
          aria-label={t('createRuntime.apps.removeLabel', { app: application.name })}
          onClick={() => onRemove(application.name)}
        >
          <IconX />
          <span className="sr-only">{t('createRuntime.apps.removeLabel', { app: application.name })}</span>
        </Button>
      </div>
    </div>
  )
}
