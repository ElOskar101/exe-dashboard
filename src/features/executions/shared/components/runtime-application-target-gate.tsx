import { useMemo, useState, type Dispatch, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IconAlertCircle, IconRefresh, IconServer } from '@tabler/icons-react'
import {
  decodeExecutionTargetValue,
  encodeExecutionTargetValue,
  EXECUTION_APPLICATION_SEARCH_PARAM,
  EXECUTION_RUNTIME_SEARCH_PARAM,
  EXECUTION_TARGET_URL_SEARCH_PARAM,
  getExecutionTargetSearchSelection,
  getSelectedExecutionRequestTarget,
  type ExecutionTargetSearchSelection,
} from '../lib/execution-target'
import type { PlaywrightRuntime, PlaywrightRuntimeApplication } from '../model/playwright-runtime'
import { usePlaywrightRuntimesQuery } from '../hooks/use-execution-target'

const SELECT_RUNTIME_APPLICATION_RETURN_TO_SEARCH_PARAM = 'returnTo'

const isApplicationSelectable = (application: PlaywrightRuntimeApplication) =>
  application.active !== false && Boolean(application.apiUrl?.trim())

const getRuntimeApplicationOptionValue = (runtimeId: string, application: PlaywrightRuntimeApplication) =>
  encodeExecutionTargetValue({
    runtimeId,
    applicationName: application.name,
    targetUrl: getSelectedExecutionRequestTarget(application).apiUrl,
  })

const findFirstSelection = (
  runtimes: readonly PlaywrightRuntime[] | undefined,
): ExecutionTargetSearchSelection | null => {
  for (const runtime of runtimes ?? []) {
    const application = runtime.applications.find(isApplicationSelectable)

    if (application) {
      return {
        runtimeId: runtime._id,
        applicationName: application.name,
        targetUrl: getSelectedExecutionRequestTarget(application).apiUrl,
      }
    }
  }

  return null
}

function RuntimeApplicationTargetDialogContent({
  defaultValue,
  onSelectionConfirmed,
  runtimes,
}: {
  defaultValue: string
  onSelectionConfirmed: Dispatch<ExecutionTargetSearchSelection>
  runtimes: readonly PlaywrightRuntime[]
}) {
  const [selectedValue, setSelectedValue] = useState(defaultValue)
  const selectedSelection = decodeExecutionTargetValue(selectedValue)

  const handleConfirm = () => {
    if (!selectedSelection) return

    onSelectionConfirmed(selectedSelection)
  }

  return (
    <>
      <Field>
        <FieldLabel htmlFor="required-execution-target">Runtime application</FieldLabel>
        <Select
          value={selectedValue}
          onValueChange={(value) => {
            if (value) setSelectedValue(value)
          }}
        >
          <SelectTrigger id="required-execution-target" className="w-full">
            <IconServer />
            <SelectValue placeholder="Choose an app" />
          </SelectTrigger>
          <SelectContent align="start">
            {runtimes.map((runtime, runtimeIndex) => (
              <SelectGroup key={runtime._id}>
                {runtimeIndex > 0 ? <SelectSeparator /> : null}
                <SelectLabel>{runtime.name}</SelectLabel>
                {runtime.applications.map((application) => (
                  <SelectItem
                    key={`${runtime._id}-${application.name}`}
                    value={getRuntimeApplicationOptionValue(runtime._id, application)}
                    disabled={!isApplicationSelectable(application)}
                  >
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate">{application.name}</span>
                      {application.active === false ? (
                        <span className="truncate text-xs font-normal text-muted-foreground">Inactive</span>
                      ) : null}
                      {!application.apiUrl?.trim() ? (
                        <span className="truncate text-xs font-normal text-muted-foreground">
                          No API URL configured
                        </span>
                      ) : null}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <DialogFooter>
        <Button type="button" onClick={handleConfirm} disabled={!selectedSelection}>
          Use selected app
        </Button>
      </DialogFooter>
    </>
  )
}

export function RuntimeApplicationTargetGate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const runtimesQuery = usePlaywrightRuntimesQuery()
  const firstSelection = useMemo(() => findFirstSelection(runtimesQuery.data), [runtimesQuery.data])
  const defaultValue = firstSelection ? encodeExecutionTargetValue(firstSelection) : ''
  const returnTo = searchParams.get(SELECT_RUNTIME_APPLICATION_RETURN_TO_SEARCH_PARAM) || '/'

  const handleSelectionConfirmed = (selection: ExecutionTargetSearchSelection) => {
    const nextUrl = new URL(returnTo, window.location.origin)

    nextUrl.searchParams.set(EXECUTION_RUNTIME_SEARCH_PARAM, selection.runtimeId)
    nextUrl.searchParams.set(EXECUTION_APPLICATION_SEARCH_PARAM, selection.applicationName)
    nextUrl.searchParams.set(EXECUTION_TARGET_URL_SEARCH_PARAM, selection.targetUrl)
    navigate(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`, { replace: true })
  }

  return (
    <Dialog open modal>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose runtime application</DialogTitle>
          <DialogDescription>
            Execution requests require an explicit runtime application for this URL.
          </DialogDescription>
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

        {!runtimesQuery.isLoading && runtimesQuery.data && !firstSelection ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>No selectable apps</AlertTitle>
            <AlertDescription>Every runtime application is inactive or missing an API URL.</AlertDescription>
          </Alert>
        ) : null}

        {runtimesQuery.data && firstSelection ? (
          <RuntimeApplicationTargetDialogContent
            key={defaultValue}
            defaultValue={defaultValue}
            onSelectionConfirmed={handleSelectionConfirmed}
            runtimes={runtimesQuery.data}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export function RequireExecutionTarget({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const hasCompleteTarget = Boolean(getExecutionTargetSearchSelection(searchParams))

  if (hasCompleteTarget) {
    return children
  }

  const returnTo = `${location.pathname}${location.search}${location.hash}`
  const selectorSearchParams = new URLSearchParams({ [SELECT_RUNTIME_APPLICATION_RETURN_TO_SEARCH_PARAM]: returnTo })

  return <Navigate to={`/select-runtime-application?${selectorSearchParams.toString()}`} replace />
}
