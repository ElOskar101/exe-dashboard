import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  IconAlertCircle,
  IconClockHour4,
  IconExternalLink,
  IconPlayerPlayFilled,
  IconPlus,
  IconRosetteDiscountCheckFilled,
} from '@tabler/icons-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  formatExecutionDate,
  normalizeExecutionStatus,
  useExecutionAppStatsQuery,
  useExecutionTarget,
  useExecutionTargetNavigation,
  useExecutionsQuery,
} from '@/features/executions'
import { ExecutionStatusLabel } from '@/features/executions/listing/components/execution-status-label'
import {
  getExecutionDisplayNames,
  getExecutionProjectLabel,
} from '@/features/executions/listing/lib/execution-listing-filters'
import { getExecutionDayLabel } from '@/features/executions/listing/lib/execution-sidebar-display'

const LATEST_EXECUTIONS_LIMIT = 5

const formatNumber = (value: number | undefined) => new Intl.NumberFormat().format(value ?? 0)

export default function HomePage() {
  const { t } = useTranslation('home')
  const { target } = useExecutionTarget()
  const { getPathWithExecutionTarget } = useExecutionTargetNavigation()
  const statsQuery = useExecutionAppStatsQuery()
  const executionsQuery = useExecutionsQuery({ limit: LATEST_EXECUTIONS_LIMIT })
  const latestExecutions = useMemo(
    () =>
      [...(executionsQuery.data ?? [])].sort(
        (leftExecution, rightExecution) =>
          new Date(rightExecution.createdAt).getTime() - new Date(leftExecution.createdAt).getTime(),
      ),
    [executionsQuery.data],
  )
  const finishedExecutions = (statsQuery.data?.jobs.completed ?? 0) + (statsQuery.data?.jobs.failed ?? 0)
  const statCards = [
    {
      description: t('stats.queued.description'),
      icon: IconClockHour4,
      title: t('stats.queued.title'),
      value: statsQuery.data?.jobs.queued,
    },
    {
      description: t('stats.running.description', { active: formatNumber(statsQuery.data?.jobs.active) }),
      icon: IconPlayerPlayFilled,
      title: t('stats.running.title'),
      value: statsQuery.data?.jobs.running,
    },
    {
      description: t('stats.finished.description', { failed: formatNumber(statsQuery.data?.jobs.failed) }),
      icon: IconRosetteDiscountCheckFilled,
      title: t('stats.finished.title'),
      value: finishedExecutions,
    },
  ]

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="max-w-3xl text-muted-foreground">{t('description', { app: target.label })}</p>
        </div>
        <Button nativeButton={false} render={<Link to={getPathWithExecutionTarget('/create')} />}>
          <IconPlus data-icon="inline-start" />
          {t('createExecution')}
        </Button>
      </div>

      {statsQuery.isError || executionsQuery.isError ? (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertTitle>{t('loadErrorTitle')}</AlertTitle>
          <AlertDescription>{t('loadErrorDescription')}</AlertDescription>
          <Button
            className="mt-3 w-fit"
            size="sm"
            variant="outline"
            onClick={() => {
              void statsQuery.refetch()
              void executionsQuery.refetch()
            }}
          >
            {t('retry')}
          </Button>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => {
          const StatIcon = stat.icon

          return (
            <Card key={stat.title} size="sm">
              <CardHeader>
                <CardTitle>{stat.title}</CardTitle>
                <CardDescription>{stat.description}</CardDescription>
                <CardAction>
                  <StatIcon className="text-muted-foreground" />
                </CardAction>
              </CardHeader>
              <CardContent>
                {statsQuery.isLoading ? (
                  <Skeleton className="h-10 w-24 rounded-2xl" />
                ) : (
                  <div className="text-4xl font-semibold tracking-tight">{formatNumber(stat.value)}</div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle>{t('latest.title')}</CardTitle>
          <CardDescription>{t('latest.description')}</CardDescription>
          <CardAction>
            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              render={<Link to={getPathWithExecutionTarget('/executions')} />}
            >
              {t('latest.viewAll')}
              <IconExternalLink data-icon="inline-end" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {executionsQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: LATEST_EXECUTIONS_LIMIT }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-2xl" />
              ))}
            </div>
          ) : null}

          {!executionsQuery.isLoading ? (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28 whitespace-normal">{t('latest.columns.execution')}</TableHead>
                  <TableHead className="w-28">{t('latest.columns.status')}</TableHead>
                  <TableHead className="hidden whitespace-normal lg:table-cell">{t('latest.columns.client')}</TableHead>
                  <TableHead className="hidden whitespace-normal lg:table-cell">{t('latest.columns.clinic')}</TableHead>
                  <TableHead className="hidden whitespace-normal xl:table-cell">
                    {t('latest.columns.project')}
                  </TableHead>
                  <TableHead className="hidden w-28 whitespace-normal md:table-cell">
                    {t('latest.columns.createdAt')}
                  </TableHead>
                  <TableHead className="w-20 text-right">{t('latest.columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestExecutions.length > 0 ? (
                  latestExecutions.map((execution) => {
                    const displayNames = getExecutionDisplayNames(execution)

                    return (
                      <TableRow key={execution._id}>
                        <TableCell className="font-medium whitespace-normal break-words">
                          <Link
                            className="hover:underline"
                            to={getPathWithExecutionTarget(`/execution/${execution._id}`)}
                          >
                            {getExecutionDayLabel(execution)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <ExecutionStatusLabel status={normalizeExecutionStatus(execution.status)} />
                        </TableCell>
                        <TableCell className="hidden whitespace-normal break-words lg:table-cell">
                          {displayNames.client || t('latest.emptyValue')}
                        </TableCell>
                        <TableCell className="hidden whitespace-normal break-words lg:table-cell">
                          {displayNames.clinic || t('latest.emptyValue')}
                        </TableCell>
                        <TableCell className="hidden whitespace-normal break-words xl:table-cell">
                          {getExecutionProjectLabel(execution)}
                        </TableCell>
                        <TableCell className="hidden whitespace-nowrap md:table-cell">
                          {formatExecutionDate(execution.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              nativeButton={false}
                              variant="outline"
                              size="sm"
                              render={<Link to={getPathWithExecutionTarget(`/execution/${execution._id}`)} />}
                            >
                              <span className="sr-only sm:not-sr-only">{t('latest.viewDetails')}</span>
                              <IconExternalLink data-icon="inline-end" className="not-sr-only sm:sr-only" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell className="h-28 text-center text-muted-foreground" colSpan={7}>
                      {t('latest.empty')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
