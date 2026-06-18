import { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
  getPlaywrightRuntimeApplications,
  getRuntimeApplicationUnavailableLabel,
  getSelectedExecutionRequestTarget,
  isRuntimeApplicationSelectable,
  type PlaywrightRuntimeApplication,
  useExecutionAppStatsQuery,
  useExecutionTarget,
  useExecutionTargetNavigation,
  useExecutionTargetSetter,
  usePlaywrightRuntimesQuery,
  useRuntimeApplicationAvailability,
} from '@/features/executions'
import { useTheme } from '@/hooks/use-theme'
import { IconBox, IconDeviceDesktop } from '@tabler/icons-react'

const getRuntimeApplicationOptionValue = (runtimeId: string, application: PlaywrightRuntimeApplication) =>
  encodeExecutionTargetValue({
    runtimeId,
    applicationName: application.name,
    targetUrl: getSelectedExecutionRequestTarget(application).apiUrl,
  })

const runtimeApplicationUnavailableLabels = {
  checkingAvailability: 'Checking API availability',
  inactive: 'Inactive',
  noApiUrl: 'No API URL configured',
  statsUnavailable: 'Stats endpoint did not respond successfully',
}

const Header: () => JSX.Element = () => {
  const { t } = useTranslation(['common', 'settings'])
  const { theme, handleTheme } = useTheme()
  const { target } = useExecutionTarget()
  const { getPathWithExecutionTarget, getSettingsPath } = useExecutionTargetNavigation()
  const runtimesQuery = usePlaywrightRuntimesQuery()
  const { availableApiUrls, isCheckingAvailability } = useRuntimeApplicationAvailability(runtimesQuery.data)
  const appStatsQuery = useExecutionAppStatsQuery()
  const setExecutionTarget = useExecutionTargetSetter()
  const selectedRuntime = runtimesQuery.data?.find((runtime) => runtime._id === target.runtimeId)
  const selectedApplication = getPlaywrightRuntimeApplications(selectedRuntime).find(
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
  const activeJobs = appStatsQuery.data?.jobs.active
  const runningJobs = appStatsQuery.data?.jobs.running
  const selectedRuntimeLabel = selectedRuntime?.name ?? target.runtimeId
  const selectedApplicationEnvironment = selectedApplication?.nonProduction
    ? t('settings:runtime.nonProduction')
    : t('settings:runtime.production')

  const handleTargetChange = (value: string | null) => {
    if (!value) {
      return
    }

    setExecutionTarget(decodeExecutionTargetValue(value))
  }

  return (
    <>
      <header className="z-1 w-full border-b border-border">
        <nav className="flex w-full items-center justify-between px-4 py-2.5 md:px-6">
          <div className="hidden min-w-0 flex items-center gap-1.5 sm:flex">
            <img className="h-auto w-24 object-contain" src="/agent-icon.svg" alt={t('common:project-name')} />
            <div className="flex min-w-0 items-center gap-1.5">
              {isLoadingStats ? (
                <Skeleton className="h-6 w-28 rounded-3xl" />
              ) : (
                <Popover>
                  <PopoverTrigger
                    openOnHover
                    delay={0}
                    render={
                      <Badge
                        variant="outline"
                        render={<button type="button" />}
                        className="h-6 max-w-48 gap-1.5 border-border bg-transparent px-2"
                        aria-label={t('settings:status.title')}
                      />
                    }
                  >
                    <IconDeviceDesktop data-icon="inline-start" />
                    <span className="truncate">{selectedRuntimeLabel}</span>
                    <span
                      aria-label={isServerUp ? 'Server up' : 'Server unavailable'}
                      className={isServerUp ? 'size-2 rounded-full bg-success' : 'size-2 rounded-full bg-muted'}
                    />
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-72 gap-3">
                    <dl className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">{t('settings:runtime.runtime')}</dt>
                        <dd className="truncate font-medium">{selectedRuntimeLabel}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">{t('settings:runtime.environmentLabel')}</dt>
                        <dd className="font-medium">{selectedApplicationEnvironment}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">{t('settings:status.services.server')}</dt>
                        <dd className="flex items-center gap-1.5 font-medium">
                          <span
                            aria-hidden="true"
                            className={isServerUp ? 'size-2 rounded-full bg-success' : 'size-2 rounded-full bg-muted'}
                          />
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">{t('settings:status.jobs.active')}</dt>
                        <dd className="font-medium">{activeJobs ?? '-'}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">{t('settings:status.jobs.running')}</dt>
                        <dd className="font-medium">{runningJobs ?? '-'}</dd>
                      </div>
                    </dl>
                  </PopoverContent>
                </Popover>
              )}
            </div>
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
                  <span className="truncate">{target.label}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                {runtimesQuery.data?.map((runtime, runtimeIndex) => {
                  const runtimeApplications = getPlaywrightRuntimeApplications(runtime)

                  return (
                    <SelectGroup key={runtime._id}>
                      {runtimeIndex > 0 ? <SelectSeparator /> : null}
                      <SelectLabel>{runtime.name}</SelectLabel>
                      {runtimeApplications.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          {t('settings:runtime.emptyApplications')}
                        </div>
                      ) : null}
                      {runtimeApplications.map((application) => {
                        const unavailableLabel = getRuntimeApplicationUnavailableLabel(
                          application,
                          availableApiUrls,
                          isCheckingAvailability,
                          runtimeApplicationUnavailableLabels,
                        )

                        return (
                          <SelectItem
                            key={`${runtime._id}-${application.name}`}
                            value={getRuntimeApplicationOptionValue(runtime._id, application)}
                            disabled={
                              !isRuntimeApplicationSelectable(application, availableApiUrls, isCheckingAvailability)
                            }
                          >
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className="flex min-w-0 items-center gap-1.5">
                                <IconBox className="size-4 shrink-0 text-muted-foreground" />
                                <span className="truncate">{application.name}</span>
                              </span>
                              {unavailableLabel ? (
                                <span className="truncate text-xs font-normal text-muted-foreground">
                                  {unavailableLabel}
                                </span>
                              ) : null}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectGroup>
                  )
                })}
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
