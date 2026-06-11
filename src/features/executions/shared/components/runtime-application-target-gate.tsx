import { useMemo, useState, type Dispatch, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
import { IconAlertCircle, IconBox, IconRefresh } from '@tabler/icons-react'
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

function RuntimeApplicationTargetCardContent({
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
  const selectedRuntime = runtimes.find((runtime) => runtime._id === selectedSelection?.runtimeId)

  const handleConfirm = () => {
    if (!selectedSelection) return

    onSelectionConfirmed(selectedSelection)
  }

  return (
    <>
      <CardContent className="gap-4">
        <Field>
          <FieldLabel htmlFor="required-execution-target">Runtime application</FieldLabel>
          <Select
            value={selectedValue}
            onValueChange={(value) => {
              if (value) setSelectedValue(value)
            }}
          >
            <SelectTrigger id="required-execution-target" className="w-full">
              <IconBox className="size-4" />
              <SelectValue placeholder="Choose an app">
                {selectedSelection ? (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate">{selectedSelection.applicationName}</span>
                    <span className="truncate text-xs font-normal text-muted-foreground">
                      {selectedRuntime?.name ?? selectedSelection.runtimeId}
                    </span>
                  </span>
                ) : null}
              </SelectValue>
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
                        <span className="flex min-w-0 items-center gap-1.5">
                          <IconBox className="size-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{application.name}</span>
                        </span>
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
      </CardContent>

      <CardFooter>
        <Button type="button" onClick={handleConfirm} disabled={!selectedSelection}>
          Use selected app
        </Button>
      </CardFooter>
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Choose runtime application</CardTitle>
          <CardDescription>Execution requests require an explicit runtime application for this URL.</CardDescription>
        </CardHeader>

        {runtimesQuery.isError ? (
          <CardContent>
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
          </CardContent>
        ) : null}

        {runtimesQuery.isLoading ? (
          <CardContent>
            <div className="text-sm text-muted-foreground">Loading apps...</div>
          </CardContent>
        ) : null}

        {!runtimesQuery.isLoading && runtimesQuery.data && !firstSelection ? (
          <CardContent>
            <Alert variant="destructive">
              <IconAlertCircle />
              <AlertTitle>No selectable apps</AlertTitle>
              <AlertDescription>Every runtime application is inactive or missing an API URL.</AlertDescription>
            </Alert>
          </CardContent>
        ) : null}

        {runtimesQuery.data && firstSelection ? (
          <RuntimeApplicationTargetCardContent
            key={defaultValue}
            defaultValue={defaultValue}
            onSelectionConfirmed={handleSelectionConfirmed}
            runtimes={runtimesQuery.data}
          />
        ) : null}
      </Card>
    </div>
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
