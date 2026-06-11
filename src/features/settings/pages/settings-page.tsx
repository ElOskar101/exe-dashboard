import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  decodeExecutionTargetValue,
  encodeExecutionTargetValue,
  getSelectedExecutionRequestTarget,
  type ExecutionAppStats,
  type PlaywrightProject,
  type PlaywrightRuntime,
  type PlaywrightRuntimeApplication,
  useExecutionTarget,
  useExecutionAppStatsQuery,
  useExecutionTargetSetter,
  usePlaywrightProjectsQuery,
  usePlaywrightRuntimesQuery,
} from '@/features/executions'
import {
  IconActivity,
  IconAlertCircle,
  IconBriefcase,
  IconClock,
  IconDatabase,
  IconDeviceDesktop,
  IconRefresh,
  IconServer,
  IconSettings,
} from '@tabler/icons-react'
import { type TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

const SETTINGS_TAB_SEARCH_PARAM = 'settingsTab'
const DEFAULT_SETTINGS_TAB = 'runtime-application'
const SETTINGS_TABS = [DEFAULT_SETTINGS_TAB, 'app-status'] as const

type SettingsTab = (typeof SETTINGS_TABS)[number]

const isSettingsTab = (value: string | null): value is SettingsTab => SETTINGS_TABS.some((tab) => tab === value)

const getRuntimeApplicationOptionValue = (runtimeId: string, application: PlaywrightRuntimeApplication) =>
  encodeExecutionTargetValue({
    runtimeId,
    applicationName: application.name,
    targetUrl: getSelectedExecutionRequestTarget(application).apiUrl,
  })

const isApplicationSelectable = (application: PlaywrightRuntimeApplication) =>
  application.active !== false && Boolean(application.apiUrl?.trim())

const getConfiguredApplicationLimit = (value: number | undefined, fallback: number) => value ?? fallback

const getCatalogSummary = (runtimes: readonly PlaywrightRuntime[] | undefined) => {
  const applications = runtimes?.flatMap((runtime) => runtime.applications) ?? []
  const activeApplications = applications.filter((application) => application.active !== false).length
  const nonProductionApplications = applications.filter((application) => application.nonProduction).length

  return {
    activeApplications,
    applications: applications.length,
    nonProductionApplications,
    runtimes: runtimes?.length ?? 0,
  }
}

const getProjectSummary = (projects: readonly PlaywrightProject[] | undefined) => {
  const activeProjects = projects?.filter((project) => project.active !== false) ?? []

  return {
    activeProjects: activeProjects.length,
    associatedBots: activeProjects.reduce((total, project) => total + project.associatedWith.length, 0),
    projects: projects?.length ?? 0,
  }
}

const formatUptime = (seconds: number, t: TFunction<'settings'>) => {
  const totalSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60

  if (hours > 0) {
    return t('status.uptimeHours', { hours, minutes, seconds: remainingSeconds })
  }

  if (minutes > 0) {
    return t('status.uptimeMinutes', { minutes, seconds: remainingSeconds })
  }

  return t('status.uptimeSeconds', { seconds: remainingSeconds })
}

const formatStatusTimestamp = (timestamp: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(timestamp))

const getStatusBadgeVariant = (status: string) => (status.toLowerCase() === 'up' ? 'success' : 'destructive')

const STATUS_SERVICES = [
  { key: 'server', icon: IconDeviceDesktop },
  { key: 'mongo', icon: IconDatabase },
  { key: 'redis', icon: IconActivity },
] as const

const JOB_STAT_KEYS = [
  'waiting',
  'active',
  'queued',
  'running',
  'completed',
  'failed',
  'delayed',
  'paused',
  'prioritized',
  'waitingChildren',
] as const

function AppStatusSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {STATUS_SERVICES.map(({ key }) => (
          <Skeleton key={key} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-24 rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {JOB_STAT_KEYS.map((key) => (
          <Skeleton key={key} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

function AppStatusPanel({ runtimeName, stats }: { runtimeName: string; stats: ExecutionAppStats }) {
  const { t } = useTranslation('settings')

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {STATUS_SERVICES.map(({ key, icon: Icon }) => {
          const service = stats[key]
          const serviceLabel = key === 'server' ? runtimeName : t(`status.services.${key}`)

          return (
            <div key={key} className="flex min-w-0 flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon />
                  <span className="truncate text-sm font-medium" title={serviceLabel}>
                    {serviceLabel}
                  </span>
                </div>
                <Badge variant={getStatusBadgeVariant(service.status)}>{service.status}</Badge>
              </div>
              {key === 'mongo' ? (
                <div className="flex flex-col gap-1 text-sm text-white/80">
                  <span>{t('status.mongoState', { state: stats.mongo.state })}</span>
                  <span>{t('status.mongoReadyState', { readyState: stats.mongo.readyState })}</span>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 items-center gap-3 rounded-lg border p-4">
          <IconClock />
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-medium" title={t('status.uptime')}>
              {t('status.uptime')}
            </span>
            <span className="truncate text-white/80">{formatUptime(stats.uptime, t)}</span>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-3 rounded-lg border p-4">
          <IconActivity />
          <div className="flex min-w-0 flex-col">
            <span className="text-sm" title={t('status.timestamp')}>
              {t('status.timestamp')}
            </span>
            <span className="truncate text-white/80">{formatStatusTimestamp(stats.timestamp)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <IconBriefcase />
          <span className="text-sm font-medium">{t('status.jobsTitle')}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {JOB_STAT_KEYS.map((key) => (
            <div key={key} className="rounded-lg border p-4">
              <div className="truncate font-medium text-sm" title={t(`status.jobs.${key}`)}>
                {t(`status.jobs.${key}`)}
              </div>
              <div className="text-2xl text-white/80 font-normal">{stats.jobs[key]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { t } = useTranslation('settings')
  const [searchParams, setSearchParams] = useSearchParams()
  const { target } = useExecutionTarget()
  const runtimesQuery = usePlaywrightRuntimesQuery()
  const projectsQuery = usePlaywrightProjectsQuery()
  const appStatsQuery = useExecutionAppStatsQuery()
  const setExecutionTarget = useExecutionTargetSetter()
  const selectedRuntime = runtimesQuery.data?.find((runtime) => runtime._id === target.runtimeId)
  const selectedApplication = selectedRuntime?.applications.find(
    (application) => application.name === target.applicationName,
  )
  const selectedValue = encodeExecutionTargetValue({
    runtimeId: target.runtimeId,
    applicationName: target.applicationName,
    targetUrl: target.requestTarget.apiUrl,
  })
  const effectiveApiUrl = target.requestTarget.apiUrl
  const selectedApplicationDescription = selectedApplication?.description ?? t('runtime.noDescription')
  const catalogSummary = getCatalogSummary(runtimesQuery.data)
  const projectSummary = getProjectSummary(projectsQuery.data)
  const selectedSettingsTab = isSettingsTab(searchParams.get(SETTINGS_TAB_SEARCH_PARAM))
    ? searchParams.get(SETTINGS_TAB_SEARCH_PARAM)
    : DEFAULT_SETTINGS_TAB

  const handleSettingsTabChange = (value: string | null) => {
    const nextTab = isSettingsTab(value) ? value : DEFAULT_SETTINGS_TAB

    setSearchParams(
      (currentSearchParams) => {
        const nextSearchParams = new URLSearchParams(currentSearchParams)

        if (nextTab === DEFAULT_SETTINGS_TAB) {
          nextSearchParams.delete(SETTINGS_TAB_SEARCH_PARAM)
        } else {
          nextSearchParams.set(SETTINGS_TAB_SEARCH_PARAM, nextTab)
        }

        return nextSearchParams
      },
      { replace: true },
    )
  }

  const handleTargetChange = (value: string | null) => {
    if (!value) {
      return
    }

    setExecutionTarget(decodeExecutionTargetValue(value))
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Card>
        <CardContent>
          <Tabs
            value={selectedSettingsTab}
            onValueChange={handleSettingsTabChange}
            orientation="vertical"
            className="flex-col gap-6 sm:items-stretch sm:flex-row"
          >
            <TabsList
              variant="line"
              className="w-full shrink-0 items-stretch justify-start rounded-none border-border sm:min-h-full sm:w-56 sm:self-stretch sm:border-r sm:pr-4"
            >
              <TabsTrigger
                value="runtime-application"
                className="after:hidden data-active:font-semibold data-active:text-foreground"
              >
                <IconServer data-icon="inline-start" />
                {t('runtime.sidebarTrigger')}
              </TabsTrigger>
              <TabsTrigger
                value="app-status"
                className="after:hidden data-active:font-semibold data-active:text-foreground"
              >
                <IconActivity data-icon="inline-start" />
                {t('status.sidebarTrigger')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="runtime-application" className="flex min-w-0 flex-col gap-6">
              {runtimesQuery.isError ? (
                <Alert variant="destructive">
                  <IconAlertCircle />
                  <AlertTitle>{t('runtime.loadErrorTitle')}</AlertTitle>
                  <AlertDescription>{t('runtime.loadErrorDescription')}</AlertDescription>
                </Alert>
              ) : null}

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="execution-target">{t('runtime.targetLabel')}</FieldLabel>
                  <Select value={selectedValue} onValueChange={handleTargetChange}>
                    <SelectTrigger id="execution-target" className="w-full">
                      <SelectValue placeholder={t('runtime.targetPlaceholder')}>{target.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      {runtimesQuery.data?.map((runtime, runtimeIndex) => (
                        <SelectGroup key={runtime._id}>
                          {runtimeIndex > 0 ? <SelectSeparator /> : null}
                          <SelectLabel>{runtime.name}</SelectLabel>
                          {runtime.applications.map((application) => {
                            const isSelectable = isApplicationSelectable(application)

                            return (
                              <SelectItem
                                key={`${runtime._id}-${application.name}`}
                                value={getRuntimeApplicationOptionValue(runtime._id, application)}
                                disabled={!isSelectable}
                              >
                                <span className="flex min-w-0 flex-col gap-1">
                                  <span className="flex min-w-0 items-center gap-2">
                                    <span className="truncate">{application.name}</span>
                                    {application.nonProduction ? (
                                      <Badge variant="outline">{t('runtime.nonProduction')}</Badge>
                                    ) : null}
                                  </span>
                                  {application.active === false ? (
                                    <span className="truncate text-xs font-normal text-muted-foreground">
                                      {t('runtime.inactive')}
                                    </span>
                                  ) : null}
                                  {!application.apiUrl?.trim() ? (
                                    <span className="truncate text-xs font-normal text-muted-foreground">
                                      {t('runtime.noApiUrl')}
                                    </span>
                                  ) : null}
                                </span>
                              </SelectItem>
                            )
                          })}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t('runtime.effectiveApiUrl')}</span>
                  <IconServer />
                </div>
                <span>{effectiveApiUrl}</span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="grid min-w-0 gap-2 rounded-lg border px-3 py-2 sm:grid-cols-2 sm:items-center">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium">{selectedRuntime?.name ?? target.runtimeId}</span>
                    <Badge variant="secondary">{t('runtime.runtime')}</Badge>
                  </div>
                </div>
                <div className="flex min-w-0 flex-col gap-3 rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 truncate text-sm font-medium">{target.applicationName}</span>
                    <Badge variant={selectedApplication?.active === false ? 'destructive' : 'success'}>
                      {selectedApplication?.active === false ? t('runtime.inactive') : t('runtime.active')}
                    </Badge>
                    <Badge variant={selectedApplication?.nonProduction ? 'outline' : 'secondary'}>
                      {selectedApplication?.nonProduction ? t('runtime.nonProduction') : t('runtime.production')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedApplicationDescription}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <div className="truncate text-xs text-muted-foreground">{t('runtime.maxWorkers')}</div>
                      <div className="text-lg font-semibold">
                        {getConfiguredApplicationLimit(selectedApplication?.config?.maxWorkers, 10)}
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="truncate text-xs text-muted-foreground">{t('runtime.maxRetries')}</div>
                      <div className="text-lg font-semibold">
                        {getConfiguredApplicationLimit(selectedApplication?.config?.maxRetries, 3)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="truncate text-sm text-muted-foreground">{t('runtime.catalogRuntimes')}</div>
                  <div className="text-2xl font-semibold">{catalogSummary.runtimes}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="truncate text-sm text-muted-foreground">{t('runtime.catalogApplications')}</div>
                  <div className="text-2xl font-semibold">
                    {t('runtime.activeOutOfTotal', {
                      active: catalogSummary.activeApplications,
                      total: catalogSummary.applications,
                    })}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="truncate text-sm text-muted-foreground">{t('runtime.catalogDevApps')}</div>
                  <div className="text-2xl font-semibold">{catalogSummary.nonProductionApplications}</div>
                </div>
              </div>

              {projectsQuery.isError ? (
                <Alert variant="destructive">
                  <IconAlertCircle />
                  <AlertTitle>{t('projects.loadErrorTitle')}</AlertTitle>
                  <AlertDescription>{t('projects.loadErrorDescription')}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="truncate text-sm text-muted-foreground">{t('projects.catalogProjects')}</div>
                  <div className="text-2xl font-semibold">
                    {t('projects.activeOutOfTotal', {
                      active: projectSummary.activeProjects,
                      total: projectSummary.projects,
                    })}
                  </div>
                </div>
                <div className="rounded-lg border p-4 sm:col-span-2">
                  <div className="truncate text-sm text-muted-foreground">{t('projects.associatedBots')}</div>
                  <div className="text-2xl font-semibold">{projectSummary.associatedBots}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="app-status" className="flex min-w-0 flex-col gap-6">
              {appStatsQuery.isError ? (
                <Alert variant="destructive">
                  <IconAlertCircle />
                  <AlertTitle>{t('status.loadErrorTitle')}</AlertTitle>
                  <AlertDescription className="flex flex-col items-start gap-3">
                    <span>{t('status.loadErrorDescription')}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void appStatsQuery.refetch()
                      }}
                    >
                      <IconRefresh data-icon="inline-start" />
                      {t('status.refresh')}
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : null}

              {appStatsQuery.isLoading ? <AppStatusSkeleton /> : null}
              {appStatsQuery.data ? (
                <AppStatusPanel runtimeName={selectedRuntime?.name ?? target.runtimeId} stats={appStatsQuery.data} />
              ) : null}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
