import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  type PlaywrightRuntime,
  type PlaywrightRuntimeApplication,
  usePlaywrightRuntimesQuery,
} from '@/features/executions'
import {
  IconAlertCircle,
  IconRefresh,
  IconServer,
  IconShieldLock,
  IconShieldCheck,
  IconSettings,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

const getRuntimeSummary = (runtimes: readonly PlaywrightRuntime[] | undefined) => {
  const applications = runtimes?.flatMap((runtime) => runtime.applications) ?? []

  return {
    activeApplications: applications.filter((application) => application.active !== false).length,
    applications: applications.length,
    missingApiUrlApplications: applications.filter((application) => !application.apiUrl?.trim()).length,
    nonProductionApplications: applications.filter((application) => application.nonProduction).length,
    publicRuntimes: runtimes?.filter((runtime) => runtime.accessInfo.type === 'public').length ?? 0,
    runtimes: runtimes?.length ?? 0,
  }
}

const getApplicationSummary = (applications: readonly PlaywrightRuntimeApplication[]) => ({
  activeApplications: applications.filter((application) => application.active !== false).length,
  missingApiUrlApplications: applications.filter((application) => !application.apiUrl?.trim()).length,
  nonProductionApplications: applications.filter((application) => application.nonProduction).length,
  totalApplications: applications.length,
})

const getConfiguredApplicationLimit = (value: number | undefined, fallback: number) => value ?? fallback

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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-4xl" />
    </div>
  )
}

export function RuntimesPage() {
  const { t } = useTranslation('runtimes')
  const runtimesQuery = usePlaywrightRuntimesQuery()
  const catalogSummary = getRuntimeSummary(runtimesQuery.data)

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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <CatalogMetric label={t('summary.runtimes')} value={catalogSummary.runtimes} />
            <CatalogMetric label={t('summary.applications')} value={catalogSummary.applications} />
            <CatalogMetric label={t('summary.activeApplications')} value={catalogSummary.activeApplications} />
            <CatalogMetric
              label={t('summary.nonProductionApplications')}
              value={catalogSummary.nonProductionApplications}
            />
            <CatalogMetric
              label={t('summary.missingApiUrlApplications')}
              value={catalogSummary.missingApiUrlApplications}
            />
          </div>

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

function CatalogMetric({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{new Intl.NumberFormat().format(value)}</CardTitle>
      </CardHeader>
    </Card>
  )
}

function RuntimeCatalogCard({ runtime }: { runtime: PlaywrightRuntime }) {
  const { t } = useTranslation('runtimes')
  const summary = getApplicationSummary(runtime.applications)

  return (
    <Card size="sm">
      <CardHeader className="gap-3">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <IconServer className="shrink-0" />
              <CardTitle>{runtime.name}</CardTitle>
              <AccessBadge type={runtime.accessInfo.type} />
            </div>
            <CardDescription>{runtime.description?.trim() || t('noDescription')}</CardDescription>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Badge variant="secondary">{t('runtimeSummary.total', { count: summary.totalApplications })}</Badge>
            <Badge variant="success">{t('runtimeSummary.active', { count: summary.activeApplications })}</Badge>
            {summary.nonProductionApplications > 0 ? (
              <Badge variant="outline">
                {t('runtimeSummary.nonProduction', { count: summary.nonProductionApplications })}
              </Badge>
            ) : null}
            {summary.missingApiUrlApplications > 0 ? (
              <Badge variant="destructive">
                {t('runtimeSummary.missingApiUrl', { count: summary.missingApiUrlApplications })}
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-52 whitespace-normal">{t('columns.application')}</TableHead>
              <TableHead className="w-32">{t('columns.status')}</TableHead>
              <TableHead className="w-36">{t('columns.access')}</TableHead>
              <TableHead className="w-44">{t('columns.config')}</TableHead>
              <TableHead className="min-w-72 whitespace-normal">{t('columns.apiUrl')}</TableHead>
              <TableHead className="min-w-64 whitespace-normal">{t('columns.description')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runtime.applications.length > 0 ? (
              runtime.applications.map((application) => (
                <TableRow key={`${runtime._id}-${application.name}`}>
                  <TableCell className="whitespace-normal break-words font-medium">{application.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={application.active === false ? 'destructive' : 'success'}>
                        {application.active === false ? t('status.inactive') : t('status.active')}
                      </Badge>
                      <Badge variant={application.nonProduction ? 'outline' : 'secondary'}>
                        {application.nonProduction ? t('status.nonProduction') : t('status.production')}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <AccessBadge type={application.accessInfo.type} />
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <IconSettings />
                        {t('config.maxWorkers', {
                          count: getConfiguredApplicationLimit(application.config?.maxWorkers, 10),
                        })}
                      </span>
                      <span>
                        {t('config.maxRetries', {
                          count: getConfiguredApplicationLimit(application.config?.maxRetries, 3),
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal break-all text-muted-foreground">
                    {application.apiUrl?.trim() || t('noApiUrl')}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words text-muted-foreground">
                    {application.description?.trim() || t('noDescription')}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={6}>
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
