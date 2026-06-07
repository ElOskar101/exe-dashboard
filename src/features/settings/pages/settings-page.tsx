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
  DEFAULT_EXECUTION_TARGET_KEY,
  decodeExecutionTargetValue,
  defaultExecutionTarget,
  encodeExecutionTargetValue,
  getDefaultExecutionApiUrl,
  type ExecutionAppStats,
  useExecutionTarget,
  useExecutionAppStatsQuery,
  useExecutionTargetSetter,
  usePlaywrightRuntimesQuery,
} from '@/features/executions'
import {
  IconActivity,
  IconAlertCircle,
  IconBriefcase,
  IconClock,
  IconDatabase,
  IconRefresh,
  IconServer,
  IconSettings,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

const getRuntimeApplicationOptionValue = (runtimeId: string, applicationName: string) =>
  encodeExecutionTargetValue({ runtimeId, applicationName })

const formatUptime = (seconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }

  return `${remainingSeconds}s`
}

const formatStatusTimestamp = (timestamp: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(timestamp))

const getStatusBadgeVariant = (status: string) => (status.toLowerCase() === 'up' ? 'success' : 'destructive')

const STATUS_SERVICES = [
  { key: 'server', icon: IconServer },
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

function AppStatusPanel({ stats }: { stats: ExecutionAppStats }) {
  const { t } = useTranslation('settings')

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {STATUS_SERVICES.map(({ key, icon: Icon }) => {
          const service = stats[key]

          return (
            <div key={key} className="flex min-w-0 flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon />
                  <span className="truncate text-sm font-medium">{t(`status.services.${key}`)}</span>
                </div>
                <Badge variant={getStatusBadgeVariant(service.status)}>{service.status}</Badge>
              </div>
              {key === 'mongo' ? (
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
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
            <span className="text-sm text-muted-foreground">{t('status.uptime')}</span>
            <span className="truncate font-medium">{formatUptime(stats.uptime)}</span>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-3 rounded-lg border p-4">
          <IconActivity />
          <div className="flex min-w-0 flex-col">
            <span className="text-sm text-muted-foreground">{t('status.timestamp')}</span>
            <span className="truncate font-medium">{formatStatusTimestamp(stats.timestamp)}</span>
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
              <div className="truncate text-sm text-muted-foreground">{t(`status.jobs.${key}`)}</div>
              <div className="text-2xl font-semibold">{stats.jobs[key]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { t } = useTranslation('settings')
  const { target } = useExecutionTarget()
  const runtimesQuery = usePlaywrightRuntimesQuery()
  const appStatsQuery = useExecutionAppStatsQuery()
  const setExecutionTarget = useExecutionTargetSetter()
  const selectedValue =
    target.type === 'runtime-application'
      ? getRuntimeApplicationOptionValue(target.runtime._id, target.application.name)
      : DEFAULT_EXECUTION_TARGET_KEY
  const effectiveApiUrl =
    target.type === 'runtime-application' ? target.requestTarget.apiUrl : getDefaultExecutionApiUrl()

  const handleTargetChange = (value: string | null) => {
    if (!value || value === DEFAULT_EXECUTION_TARGET_KEY) {
      setExecutionTarget(null)

      return
    }

    setExecutionTarget(decodeExecutionTargetValue(value))
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconSettings />
            <span className="text-sm font-medium">{t('page.eyebrow')}</span>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="runtime-application"
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
                      <SelectGroup>
                        <SelectItem value={DEFAULT_EXECUTION_TARGET_KEY}>{defaultExecutionTarget.label}</SelectItem>
                      </SelectGroup>

                      {runtimesQuery.data?.map((runtime) => (
                        <SelectGroup key={runtime._id}>
                          <SelectSeparator />
                          <SelectLabel>{runtime.name}</SelectLabel>
                          {runtime.applications.map((application) => {
                            const hasApiUrl = Boolean(application.apiUrl?.trim())

                            return (
                              <SelectItem
                                key={`${runtime._id}-${application.name}`}
                                value={getRuntimeApplicationOptionValue(runtime._id, application.name)}
                                disabled={!hasApiUrl}
                              >
                                <span className="flex min-w-0 flex-col">
                                  <span className="truncate">{application.name}</span>
                                  {!hasApiUrl ? (
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
              {appStatsQuery.data ? <AppStatusPanel stats={appStatsQuery.data} /> : null}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
