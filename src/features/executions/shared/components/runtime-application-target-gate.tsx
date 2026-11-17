import { useMemo, useState, type Dispatch, type ReactNode } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserCard } from '@/features/auth'
import { CreateRuntimeDialog } from '@/features/runtimes/components/create-runtime-dialog'
import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'
import { IconAlertCircle, IconBox, IconDeviceDesktop, IconRefresh } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import {
  EXECUTION_APPLICATION_SEARCH_PARAM,
  EXECUTION_RUNTIME_SEARCH_PARAM,
  EXECUTION_TARGET_URL_SEARCH_PARAM,
  getExecutionTargetSearchSelection,
  getSelectedExecutionRequestTarget,
  type ExecutionTargetSearchSelection,
} from '../lib/execution-target'
import {
  getFirstSelectableRuntimeApplication,
  getRuntimeApplicationApiUrlDomain,
  getRuntimeApplicationUnavailableLabel,
  isRuntimeApplicationStatsUnavailable,
  isRuntimeApplicationSelectable,
} from '../lib/runtime-application-availability'
import {
  getPlaywrightRuntimeApplications,
  type PlaywrightRuntime,
  type PlaywrightRuntimeApplication,
} from '../model/playwright-runtime'
import { usePlaywrightRuntimesQuery, useRuntimeApplicationAvailability } from '../hooks/use-execution-target'

const SELECT_RUNTIME_APPLICATION_RETURN_TO_SEARCH_PARAM = 'returnTo'

const runtimeApplicationUnavailableLabels = {
  checkingAvailability: 'Checking API availability',
  inactive: 'Inactive',
  noApiUrl: 'No API URL configured',
  statsUnavailable: 'Stats endpoint did not respond successfully',
}

const getFirstSelectableApplication = (
  runtime: PlaywrightRuntime | undefined,
  availableApiUrls: ReadonlySet<string>,
  isCheckingAvailability: boolean,
) => getFirstSelectableRuntimeApplication(runtime, availableApiUrls, isCheckingAvailability)

const getApplicationSelection = (
  runtimeId: string,
  application: PlaywrightRuntimeApplication,
): ExecutionTargetSearchSelection => ({
  runtimeId,
  applicationName: application.name,
  targetUrl: getSelectedExecutionRequestTarget(application).apiUrl,
})

const findFirstSelection = (
  runtimes: readonly PlaywrightRuntime[] | undefined,
  availableApiUrls: ReadonlySet<string>,
  isCheckingAvailability: boolean,
): ExecutionTargetSearchSelection | null => {
  for (const runtime of runtimes ?? []) {
    const application = getFirstSelectableApplication(runtime, availableApiUrls, isCheckingAvailability)

    if (application) {
      return getApplicationSelection(runtime._id, application)
    }
  }

  return null
}

const findApplicationSelection = (
  runtimes: readonly PlaywrightRuntime[],
  runtimeId: string,
  applicationName: string,
  availableApiUrls: ReadonlySet<string>,
  isCheckingAvailability: boolean,
): ExecutionTargetSearchSelection | null => {
  const runtime = runtimes.find((candidate) => candidate._id === runtimeId)
  const application = getPlaywrightRuntimeApplications(runtime).find((candidate) => candidate.name === applicationName)

  if (
    !runtime ||
    !application ||
    !isRuntimeApplicationSelectable(application, availableApiUrls, isCheckingAvailability)
  ) {
    return null
  }

  return getApplicationSelection(runtime._id, application)
}

const getRuntimeSelection = (
  runtimes: readonly PlaywrightRuntime[],
  runtimeId: string,
  availableApiUrls: ReadonlySet<string>,
  isCheckingAvailability: boolean,
): ExecutionTargetSearchSelection | null => {
  const runtime = runtimes.find((candidate) => candidate._id === runtimeId)
  const application = getFirstSelectableApplication(runtime, availableApiUrls, isCheckingAvailability)

  if (!runtime || !application) {
    return null
  }

  return getApplicationSelection(runtime._id, application)
}

const getRuntimeName = (runtime: PlaywrightRuntime | undefined, runtimeId: string) => runtime?.name ?? runtimeId

const getRuntimeAccessLabel = (runtime: PlaywrightRuntime) =>
  runtime.accessInfo.type.charAt(0).toUpperCase() + runtime.accessInfo.type.slice(1)

const getApplicationAccessLabel = (application: PlaywrightRuntimeApplication) =>
  application.accessInfo.type.charAt(0).toUpperCase() + application.accessInfo.type.slice(1)

function RuntimeOptionLabel({ runtime }: { runtime: PlaywrightRuntime }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="truncate">{runtime.name}</span>
      <Badge variant="outline">{getRuntimeAccessLabel(runtime)}</Badge>
    </span>
  )
}

function ApplicationOptionLabel({
  application,
  availableApiUrls,
  isCheckingAvailability,
  showApiUrlDomain = true,
}: {
  application: PlaywrightRuntimeApplication
  availableApiUrls: ReadonlySet<string>
  isCheckingAvailability: boolean
  showApiUrlDomain?: boolean
}) {
  const unavailableLabel = getRuntimeApplicationUnavailableLabel(
    application,
    availableApiUrls,
    isCheckingAvailability,
    runtimeApplicationUnavailableLabels,
  )
  const apiUrlDomain = showApiUrlDomain ? getRuntimeApplicationApiUrlDomain(application) : null
  const isStatsUnavailable = isRuntimeApplicationStatsUnavailable(application, availableApiUrls, isCheckingAvailability)

  return (
    <span className="flex min-w-0 flex-col gap-1">
      <span className="flex min-w-0 items-center gap-2">
        <IconBox className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{application.name}</span>
        <Badge variant="outline" className={application.active === false ? 'text-destructive!' : 'text-success!'}>
          {application.active === false ? 'Inactive' : 'Active'}
        </Badge>
        <Badge variant="outline">{application.nonProduction ? 'Development' : 'Production'}</Badge>
        <Badge variant="outline">{getApplicationAccessLabel(application)}</Badge>
      </span>
      {apiUrlDomain ? (
        <span
          className={cn(
            'truncate text-xs font-normal',
            isStatsUnavailable ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {apiUrlDomain}
        </span>
      ) : null}
      {unavailableLabel && !isStatsUnavailable ? (
        <span className="truncate text-xs font-normal text-muted-foreground">{unavailableLabel}</span>
      ) : null}
    </span>
  )
}

function RuntimeApplicationTargetFormContent({
  defaultValue,
  onSelectionConfirmed,
  runtimes,
  availableApiUrls,
  isCheckingAvailability,
}: {
  defaultValue: ExecutionTargetSearchSelection
  onSelectionConfirmed: Dispatch<ExecutionTargetSearchSelection>
  runtimes: readonly PlaywrightRuntime[]
  availableApiUrls: ReadonlySet<string>
  isCheckingAvailability: boolean
}) {
  const [selectedSelection, setSelectedSelection] = useState(defaultValue)
  const selectedRuntime = runtimes.find((runtime) => runtime._id === selectedSelection?.runtimeId)
  const selectedApplication = getPlaywrightRuntimeApplications(selectedRuntime).find(
    (application) => application.name === selectedSelection?.applicationName,
  )

  const handleRuntimeChange = (runtimeId: string | null) => {
    if (!runtimeId) return

    const nextSelection = getRuntimeSelection(runtimes, runtimeId, availableApiUrls, isCheckingAvailability)

    if (nextSelection) {
      setSelectedSelection(nextSelection)
    }
  }

  const handleApplicationChange = (applicationName: string | null) => {
    if (!applicationName) return

    const nextSelection = findApplicationSelection(
      runtimes,
      selectedSelection.runtimeId,
      applicationName,
      availableApiUrls,
      isCheckingAvailability,
    )

    if (nextSelection) {
      setSelectedSelection(nextSelection)
    }
  }

  const handleConfirm = () => {
    onSelectionConfirmed(selectedSelection)
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="required-execution-runtime">
              <IconDeviceDesktop data-icon="inline-start" />
              Runtime
            </FieldLabel>
            <Select value={selectedSelection.runtimeId} onValueChange={handleRuntimeChange}>
              <SelectTrigger id="required-execution-runtime" className="w-full">
                <SelectValue placeholder="Choose a runtime">
                  {selectedRuntime ? (
                    <RuntimeOptionLabel runtime={selectedRuntime} />
                  ) : (
                    <span className="truncate">{getRuntimeName(selectedRuntime, selectedSelection.runtimeId)}</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  {runtimes.map((runtime) => (
                    <SelectItem
                      key={runtime._id}
                      value={runtime._id}
                      disabled={!getFirstSelectableApplication(runtime, availableApiUrls, isCheckingAvailability)}
                    >
                      <RuntimeOptionLabel runtime={runtime} />
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="required-execution-application">
              <IconBox data-icon="inline-start" />
              Application
            </FieldLabel>
            <Select
              value={selectedSelection.applicationName}
              onValueChange={handleApplicationChange}
              disabled={!selectedRuntime}
            >
              <SelectTrigger id="required-execution-application" className="w-full">
                <SelectValue placeholder="Choose an app">
                  {selectedApplication ? (
                    <ApplicationOptionLabel
                      application={selectedApplication}
                      availableApiUrls={availableApiUrls}
                      isCheckingAvailability={isCheckingAvailability}
                      showApiUrlDomain={false}
                    />
                  ) : (
                    <span className="truncate">{selectedSelection.applicationName}</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  {getPlaywrightRuntimeApplications(selectedRuntime).map((application) => {
                    const isSelectable = isRuntimeApplicationSelectable(
                      application,
                      availableApiUrls,
                      isCheckingAvailability,
                    )

                    return (
                      <SelectItem key={application.name} value={application.name} disabled={!isSelectable}>
                        <ApplicationOptionLabel
                          application={application}
                          availableApiUrls={availableApiUrls}
                          isCheckingAvailability={isCheckingAvailability}
                        />
                      </SelectItem>
                    )
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </div>

      <DialogFooter>
        <Button className="w-full" type="button" onClick={handleConfirm}>
          Use selected app
        </Button>
      </DialogFooter>
    </>
  )
}

function EmptyRuntimeApplicationTargetFormContent() {
  return (
    <>
      <div className="flex flex-col gap-4">
        <FieldGroup>
          <Field data-disabled>
            <FieldLabel htmlFor="required-execution-runtime">
              <IconDeviceDesktop data-icon="inline-start" />
              Runtime
            </FieldLabel>
            <Select disabled>
              <SelectTrigger id="required-execution-runtime" className="w-full">
                <SelectValue placeholder="No selectable runtime" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup />
              </SelectContent>
            </Select>
          </Field>

          <Field data-disabled>
            <FieldLabel htmlFor="required-execution-application">
              <IconBox data-icon="inline-start" />
              Application
            </FieldLabel>
            <Select disabled>
              <SelectTrigger id="required-execution-application" className="w-full">
                <SelectValue placeholder="No selectable app" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup />
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </div>

      <DialogFooter>
        <CreateRuntimeDialog triggerClassName="w-full" />
      </DialogFooter>
    </>
  )
}

function RuntimeApplicationTargetHeader() {
  const { t } = useTranslation('common')
  const { theme, handleTheme } = useTheme()

  return (
    <header className="w-full border-b border-border">
      <nav className="flex w-full items-center justify-between px-4 py-2.5 md:px-6">
        <img className="h-auto w-24 object-contain" src="/agent-icon.svg" alt={t('project-name')} />
        <UserCard theme={theme} onToggleTheme={handleTheme} />
      </nav>
    </header>
  )
}

const noopOpenChange = () => {}

function RuntimeApplicationTargetDialog({
  onSelectionConfirmed,
}: {
  onSelectionConfirmed: Dispatch<ExecutionTargetSearchSelection>
}) {
  const runtimesQuery = usePlaywrightRuntimesQuery()
  const { availableApiUrls, isCheckingAvailability } = useRuntimeApplicationAvailability(runtimesQuery.data)
  const firstSelection = useMemo(
    () => findFirstSelection(runtimesQuery.data, availableApiUrls, isCheckingAvailability),
    [availableApiUrls, isCheckingAvailability, runtimesQuery.data],
  )

  return (
    <Dialog open onOpenChange={noopOpenChange} disablePointerDismissal>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Setup runtime and application</DialogTitle>
          <DialogDescription>Choose the runtime application this dashboard works with.</DialogDescription>
        </DialogHeader>

        {runtimesQuery.isError ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>Runtime catalog could not be loaded</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3">
              <span>Reload the catalog to choose the runtime application for this dashboard.</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void runtimesQuery.refetch()
                }}
              >
                <IconRefresh data-icon="inline-start" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {runtimesQuery.isLoading ? <div className="text-sm text-muted-foreground">Loading apps...</div> : null}

        {isCheckingAvailability ? (
          <div className="text-sm text-muted-foreground">Checking app availability...</div>
        ) : null}

        {!runtimesQuery.isLoading && !isCheckingAvailability && runtimesQuery.data && !firstSelection ? (
          <EmptyRuntimeApplicationTargetFormContent />
        ) : null}

        {runtimesQuery.data && firstSelection ? (
          <RuntimeApplicationTargetFormContent
            key={`${firstSelection.runtimeId}-${firstSelection.applicationName}`}
            defaultValue={firstSelection}
            onSelectionConfirmed={onSelectionConfirmed}
            runtimes={runtimesQuery.data}
            availableApiUrls={availableApiUrls}
            isCheckingAvailability={isCheckingAvailability}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export function RuntimeApplicationSelectionRedirect() {
  const [searchParams] = useSearchParams()

  return <Navigate to={searchParams.get(SELECT_RUNTIME_APPLICATION_RETURN_TO_SEARCH_PARAM) || '/'} replace />
}

export function RequireExecutionTarget({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const selection = getExecutionTargetSearchSelection(searchParams)

  const handleSelectionConfirmed = (nextSelection: ExecutionTargetSearchSelection) => {
    setSearchParams(
      (currentSearchParams) => {
        const nextSearchParams = new URLSearchParams(currentSearchParams)

        nextSearchParams.set(EXECUTION_RUNTIME_SEARCH_PARAM, nextSelection.runtimeId)
        nextSearchParams.set(EXECUTION_APPLICATION_SEARCH_PARAM, nextSelection.applicationName)
        nextSearchParams.set(EXECUTION_TARGET_URL_SEARCH_PARAM, nextSelection.targetUrl)

        return nextSearchParams
      },
      { replace: true },
    )
  }

  if (!selection) {
    return (
      <div className="flex min-h-screen flex-col">
        <RuntimeApplicationTargetHeader />
        <RuntimeApplicationTargetDialog onSelectionConfirmed={handleSelectionConfirmed} />
      </div>
    )
  }

  return children
}
