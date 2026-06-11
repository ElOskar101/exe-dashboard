import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getSelectedExecutionRequestTarget,
  useExecutionAppStatsQuery,
  useExecutionTarget,
  useExecutionTargetSetter,
  usePlaywrightProjectsQuery,
  usePlaywrightRuntimesQuery,
  type ExecutionAppStats,
  type PlaywrightRuntime,
  type PlaywrightRuntimeApplication,
} from '@/features/executions'
import {
  IconActivity,
  IconAlertCircle,
  IconBox,
  IconBriefcase,
  IconClock,
  IconDatabase,
  IconDeviceDesktop,
  IconRefresh,
} from '@tabler/icons-react'
import { type TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

const SETTINGS_TAB_SEARCH_PARAM = 'settingsTab'
const DEFAULT_SETTINGS_TAB = 'runtime-application'
const SETTINGS_TABS = [DEFAULT_SETTINGS_TAB, 'app-status'] as const

type SettingsTab = (typeof SETTINGS_TABS)[number]

const isSettingsTab = (value: string | null): value is SettingsTab => SETTINGS_TABS.some((tab) => tab === value)

const isApplicationSelectable = (application: PlaywrightRuntimeApplication) =>
  application.active !== false && Boolean(application.apiUrl?.trim())

const getFirstSelectableApplication = (runtime: PlaywrightRuntime | undefined) =>
  runtime?.applications.find(isApplicationSelectable)

const getApplicationSelection = (runtimeId: string, application: PlaywrightRuntimeApplication) => ({
  runtimeId,
  applicationName: application.name,
  targetUrl: getSelectedExecutionRequestTarget(application).apiUrl,
})

const getConfiguredApplicationLimit = (value: number | undefined, fallback: number) => value ?? fallback

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
            <div key={key} className="">
              <div className="truncate font-medium text-sm" title={t(`status.jobs.${key}`)}>
                {t(`status.jobs.${key}`)}
              </div>
              <div className="text-lg text-white/80 font-normal">{stats.jobs[key]}</div>
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
  const effectiveApiUrl = target.requestTarget.apiUrl
  const selectedRuntimeDescription = selectedRuntime?.description?.trim() || t('runtime.noDescription')
  const selectedApplicationDescription = selectedApplication?.description?.trim() || t('runtime.noDescription')
  const selectedSettingsTab = isSettingsTab(searchParams.get(SETTINGS_TAB_SEARCH_PARAM))
    ? searchParams.get(SETTINGS_TAB_SEARCH_PARAM)
    : DEFAULT_SETTINGS_TAB

  const handleSettingsTabChange = (value: string | null) => {
    const nextTab = isSettingsTab(value) ? value : DEFAULT_SETTINGS_TAB

    if (nextTab === 'app-status') {
      void appStatsQuery.refetch()
    }

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

  const handleRuntimeChange = (runtimeId: string | null) => {
    const runtime = runtimesQuery.data?.find((candidate) => candidate._id === runtimeId)
    const application = getFirstSelectableApplication(runtime)

    if (!runtime || !application) {
      return
    }

    setExecutionTarget(getApplicationSelection(runtime._id, application))
  }

  const handleApplicationChange = (applicationName: string | null) => {
    const application = selectedRuntime?.applications.find((candidate) => candidate.name === applicationName)

    if (!selectedRuntime || !application || !isApplicationSelectable(application)) {
      return
    }

    setExecutionTarget(getApplicationSelection(selectedRuntime._id, application))
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
                <IconDeviceDesktop data-icon="inline-start" />
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
                  <FieldLabel htmlFor="execution-runtime">
                    <IconDeviceDesktop data-icon="inline-start" />
                    {t('runtime.selectRuntimeLabel')}
                  </FieldLabel>
                  <Select value={target.runtimeId} onValueChange={handleRuntimeChange}>
                    <SelectTrigger id="execution-runtime" className="w-full">
                      <SelectValue placeholder={t('runtime.runtime')}>
                        {selectedRuntime?.name ?? target.runtimeId}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      {runtimesQuery.data?.map((runtime) => (
                        <SelectItem
                          key={runtime._id}
                          value={runtime._id}
                          disabled={!getFirstSelectableApplication(runtime)}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate">{runtime.name}</span>
                            <Badge variant="outline">{t(`runtime.access.${runtime.accessInfo.type}`)}</Badge>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>{selectedRuntimeDescription}</span>
                    {selectedRuntime ? (
                      <Badge variant="outline">{t(`runtime.access.${selectedRuntime.accessInfo.type}`)}</Badge>
                    ) : null}
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="execution-application">
                    <IconBox data-icon="inline-start" />
                    {t('runtime.selectApplicationLabel', { runtime: selectedRuntime?.name ?? target.runtimeId })}
                  </FieldLabel>
                  <Select
                    value={target.applicationName}
                    onValueChange={handleApplicationChange}
                    disabled={!selectedRuntime}
                  >
                    <SelectTrigger id="execution-application" className="w-full">
                      <SelectValue placeholder={t('runtime.targetPlaceholder')}>{target.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      {selectedRuntime?.applications.map((application) => {
                        const isSelectable = isApplicationSelectable(application)

                        return (
                          <SelectItem key={application.name} value={application.name} disabled={!isSelectable}>
                            <span className="flex min-w-0 flex-col gap-1">
                              <span className="flex min-w-0 items-center gap-2">
                                <IconBox className="size-4 shrink-0 text-muted-foreground" />
                                <span className="truncate">{application.name}</span>
                                <Badge
                                  variant={application.active === false ? 'destructive' : 'success'}
                                  className={
                                    application.active === false ? 'text-destructive!' : 'text-success-foreground!'
                                  }
                                >
                                  {application.active === false ? t('runtime.inactive') : t('runtime.active')}
                                </Badge>
                                <Badge variant="outline">
                                  {application.nonProduction ? t('runtime.nonProduction') : t('runtime.production')}
                                </Badge>
                                <Badge variant="outline">{t(`runtime.access.${application.accessInfo.type}`)}</Badge>
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
                    </SelectContent>
                  </Select>
                  {selectedApplication ? (
                    <div className="mt-2 rounded-lg border bg-muted/20 p-4 text-sm">
                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 flex-col gap-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <IconBox className="size-4 shrink-0 text-muted-foreground" />
                            <span className="truncate font-medium text-foreground">{selectedApplication.name}</span>
                          </div>
                          <span className="text-muted-foreground">{selectedApplicationDescription}</span>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Badge variant={selectedApplication.active === false ? 'destructive' : 'success'}>
                            {selectedApplication.active === false ? t('runtime.inactive') : t('runtime.active')}
                          </Badge>
                          <Badge variant="outline">
                            {selectedApplication.nonProduction ? t('runtime.nonProduction') : t('runtime.production')}
                          </Badge>
                          <Badge variant="outline">{t(`runtime.access.${selectedApplication.accessInfo.type}`)}</Badge>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_10rem_10rem]">
                        <div className="flex min-w-0 items-start gap-3 rounded-md border bg-background/40 p-3">
                          <div className="flex min-w-0 flex-col gap-1">
                            <span className="text-xs font-medium uppercase text-muted-foreground">
                              {t('runtime.effectiveApiUrl')}
                            </span>
                            <span className="break-all font-mono text-foreground text-xs">{effectiveApiUrl}</span>
                          </div>
                        </div>
                        <div className="rounded-md border bg-background/40 p-3">
                          <span className="text-xs font-medium uppercase text-muted-foreground">
                            {t('runtime.maxWorkers')}
                          </span>
                          <div className="mt-1 text-2xl font-semibold text-foreground">
                            {getConfiguredApplicationLimit(selectedApplication.config?.maxWorkers, 10)}
                          </div>
                        </div>
                        <div className="rounded-md border bg-background/40 p-3">
                          <span className="text-xs font-medium uppercase text-muted-foreground">
                            {t('runtime.maxRetries')}
                          </span>
                          <div className="mt-1 text-2xl font-semibold text-foreground">
                            {getConfiguredApplicationLimit(selectedApplication.config?.maxRetries, 3)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </Field>
              </FieldGroup>

              {projectsQuery.isError ? (
                <Alert variant="destructive">
                  <IconAlertCircle />
                  <AlertTitle>{t('projects.loadErrorTitle')}</AlertTitle>
                  <AlertDescription>{t('projects.loadErrorDescription')}</AlertDescription>
                </Alert>
              ) : null}
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
