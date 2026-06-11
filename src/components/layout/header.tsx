import { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
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
import { Skeleton } from '@/components/ui/skeleton'
import { UserCard } from '@/features/auth'
import {
  decodeExecutionTargetValue,
  encodeExecutionTargetValue,
  getSelectedExecutionRequestTarget,
  type PlaywrightRuntimeApplication,
  useExecutionAppStatsQuery,
  useExecutionTarget,
  useExecutionTargetNavigation,
  useExecutionTargetSetter,
  usePlaywrightRuntimesQuery,
} from '@/features/executions'
import { useTheme } from '@/hooks/use-theme'
import { IconBox, IconDeviceDesktop } from '@tabler/icons-react'

const getRuntimeApplicationOptionValue = (runtimeId: string, application: PlaywrightRuntimeApplication) =>
  encodeExecutionTargetValue({
    runtimeId,
    applicationName: application.name,
    targetUrl: getSelectedExecutionRequestTarget(application).apiUrl,
  })

const isApplicationSelectable = (application: PlaywrightRuntimeApplication) =>
  application.active !== false && Boolean(application.apiUrl?.trim())

const Header: () => JSX.Element = () => {
  const { t } = useTranslation(['common', 'settings'])
  const { theme, handleTheme } = useTheme()
  const { target } = useExecutionTarget()
  const { getPathWithExecutionTarget, getSettingsPath } = useExecutionTargetNavigation()
  const runtimesQuery = usePlaywrightRuntimesQuery()
  const appStatsQuery = useExecutionAppStatsQuery()
  const setExecutionTarget = useExecutionTargetSetter()
  const selectedRuntime = runtimesQuery.data?.find((runtime) => runtime._id === target.runtimeId)
  const selectedApplication = selectedRuntime?.applications.find(
    (application) => application.name === target.applicationName,
  )
  const targetTitle = `${selectedRuntime?.name ?? target.runtimeId} / ${target.applicationName}`
  const selectedValue = encodeExecutionTargetValue({
    runtimeId: target.runtimeId,
    applicationName: target.applicationName,
    targetUrl: target.requestTarget.apiUrl,
  })
  const serverStatus = appStatsQuery.data?.server.status.toLowerCase()
  const isServerUp = serverStatus === 'up'
  const isLoadingStats = appStatsQuery.isLoading

  const handleTargetChange = (value: string | null) => {
    if (!value) {
      return
    }

    setExecutionTarget(decodeExecutionTargetValue(value))
  }

  return (
    <>
      <header className="z-1 w-full border-b border-border">
        <nav className="container mx-auto flex items-center justify-between px-4 py-2.5 md:px-6">
          <div className="hidden min-w-0 items-center gap-1.5 sm:flex">
            {isLoadingStats ? (
              <>
                <Skeleton className="h-6 w-20 rounded-3xl" />
                <Skeleton className="h-6 w-16 rounded-3xl" />
                <Skeleton className="h-6 w-14 rounded-3xl" />
              </>
            ) : (
              <>
                <Badge variant="outline" className="h-6 gap-1.5 border-border bg-transparent px-2">
                  <IconDeviceDesktop data-icon="inline-start" />
                  <span>{selectedRuntime?.name ?? target.runtimeId}</span>
                  <span
                    aria-label={isServerUp ? 'Server up' : 'Server unavailable'}
                    className={isServerUp ? 'size-2 rounded-full bg-success' : 'size-2 rounded-full bg-muted'}
                    title={appStatsQuery.data?.server.status ?? 'Unknown'}
                  />
                </Badge>
                <Badge variant="outline" className="h-6 gap-1.5 border-border bg-transparent px-2">
                  <span>
                    {selectedApplication?.nonProduction
                      ? t('settings:runtime.nonProduction')
                      : t('settings:runtime.production')}
                  </span>
                </Badge>
                <Badge variant="outline" className="h-6 gap-1.5 border-border bg-transparent px-2">
                  <span>{appStatsQuery.data?.jobs.active ?? '-'}</span>
                  <span>{t('settings:status.jobs.active')}</span>
                </Badge>
                <Badge variant="outline" className="h-6 gap-1.5 border-border bg-transparent px-2">
                  <span>{appStatsQuery.data?.jobs.running ?? '-'}</span>
                  <span title={t('settings:status.jobs.running')}>{t('settings:status.jobs.running')}</span>
                </Badge>
              </>
            )}
          </div>

          <div className="ms-auto flex min-w-0 items-center gap-x-2">
            <Select value={selectedValue} onValueChange={handleTargetChange}>
              <SelectTrigger
                size="sm"
                className="max-w-44 border-border bg-transparent sm:max-w-64"
                title={targetTitle}
                aria-label="Choose app target"
              >
                <IconBox className="size-4" />
                <SelectValue placeholder="Choose app">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate">{target.label}</span>
                    <span className="truncate text-xs font-normal text-muted-foreground">
                      {selectedRuntime?.name ?? target.runtimeId}
                    </span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                {runtimesQuery.data?.map((runtime, runtimeIndex) => (
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
            <UserCard
              theme={theme}
              runtimesPath={getPathWithExecutionTarget('/runtimes')}
              settingsPath={getSettingsPath()}
              onToggleTheme={handleTheme}
            />
          </div>
        </nav>
      </header>
    </>
  )
}

export default Header
