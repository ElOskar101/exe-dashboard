import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { IconAlertCircle, IconExternalLink, IconPlus } from '@tabler/icons-react'
import { Cell, Label, Pie, PieChart } from 'recharts'
import type { LabelProps } from 'recharts'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  EXECUTION_STATUSES,
  type Execution,
  type ExecutionStatus,
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

const statusColorMap = {
  cancelled: 'oklch(44.6% 0.043 257.281)',
  completed: 'var(--success)',
  failed: 'var(--destructive)',
  paused: 'oklch(66.6% 0.179 58.318)',
  queued: 'var(--muted-foreground)',
  running: 'oklch(54.6% 0.245 262.881)',
  unknown: 'var(--foreground)',
} as const satisfies Record<ExecutionStatus, string>

const jobColorMap = {
  finished: 'var(--success)',
  queued: 'var(--muted-foreground)',
  running: 'oklch(54.6% 0.245 262.881)',
} as const

const getSortedExecutions = (executions: Execution[] | undefined) =>
  [...(executions ?? [])].sort(
    (leftExecution, rightExecution) =>
      new Date(rightExecution.createdAt).getTime() - new Date(leftExecution.createdAt).getTime(),
  )

const getPolarCenter = (viewBox: LabelProps['viewBox']) => {
  const candidate = viewBox as { cx?: unknown; cy?: unknown } | undefined

  if (typeof candidate?.cx !== 'number' || typeof candidate.cy !== 'number') return null

  return {
    cx: candidate.cx,
    cy: candidate.cy,
  }
}

const renderDonutCenterLabel =
  (total: number, label: string) =>
  ({ viewBox }: LabelProps) => {
    const center = getPolarCenter(viewBox)

    if (!center) return null

    return (
      <text x={center.cx} y={center.cy} textAnchor="middle" dominantBaseline="middle">
        <tspan x={center.cx} y={center.cy} className="fill-foreground text-3xl font-bold">
          {formatNumber(total)}
        </tspan>
        <tspan x={center.cx} y={center.cy + 24} className="fill-muted-foreground text-xs">
          {label}
        </tspan>
      </text>
    )
  }

export default function HomePage() {
  const { t: translate } = useTranslation('home')
  const { target } = useExecutionTarget()
  const { getPathWithExecutionTarget } = useExecutionTargetNavigation()
  const statsQuery = useExecutionAppStatsQuery()
  const executionsQuery = useExecutionsQuery()
  const sortedExecutions = useMemo(() => getSortedExecutions(executionsQuery.data), [executionsQuery.data])
  const latestExecutions = sortedExecutions.slice(0, LATEST_EXECUTIONS_LIMIT)
  const finishedExecutions = (statsQuery.data?.jobs.completed ?? 0) + (statsQuery.data?.jobs.failed ?? 0)
  const statusChartConfig = useMemo(
    () =>
      EXECUTION_STATUSES.reduce(
        (config, status) => ({
          ...config,
          [status]: {
            label: translate(`stats.status.labels.${status}`),
            color: statusColorMap[status],
          },
        }),
        {
          executions: {
            label: translate('stats.status.valueLabel'),
          },
        } satisfies ChartConfig,
      ),
    [translate],
  )
  const statusChartData = useMemo(
    () =>
      EXECUTION_STATUSES.map((status) => ({
        fill: `var(--color-${status})`,
        status,
        total: sortedExecutions.filter((execution) => normalizeExecutionStatus(execution.status) === status).length,
      })),
    [sortedExecutions],
  )
  const statusExecutionTotal = sortedExecutions.length
  const jobChartConfig = useMemo(
    () =>
      ({
        finished: {
          label: translate('stats.jobs.labels.finished'),
          color: jobColorMap.finished,
        },
        jobs: {
          label: translate('stats.jobs.valueLabel'),
        },
        queued: {
          label: translate('stats.jobs.labels.queued'),
          color: jobColorMap.queued,
        },
        running: {
          label: translate('stats.jobs.labels.running'),
          color: jobColorMap.running,
        },
      }) satisfies ChartConfig,
    [translate],
  )
  const jobChartData = [
    {
      fill: 'var(--color-queued)',
      status: 'queued',
      total: statsQuery.data?.jobs.queued ?? 0,
    },
    {
      fill: 'var(--color-running)',
      status: 'running',
      total: statsQuery.data?.jobs.running ?? 0,
    },
    {
      fill: 'var(--color-finished)',
      status: 'finished',
      total: finishedExecutions,
    },
  ]
  const jobTotal = jobChartData.reduce((total, item) => total + item.total, 0)
  const clientClinicTotals = useMemo(() => {
    const totalsByClientClinic = new Map<string, { client: string; clinic: string; total: number }>()

    sortedExecutions.forEach((execution) => {
      const client = execution.client.trim() || translate('latest.emptyValue')
      const clinic = execution.clinic.trim() || translate('latest.emptyValue')
      const key = `${client}\u0000${clinic}`
      const current = totalsByClientClinic.get(key)

      totalsByClientClinic.set(key, {
        client,
        clinic,
        total: (current?.total ?? 0) + 1,
      })
    })

    return Array.from(totalsByClientClinic.values()).sort(
      (leftTotal, rightTotal) =>
        rightTotal.total - leftTotal.total ||
        leftTotal.client.localeCompare(rightTotal.client) ||
        leftTotal.clinic.localeCompare(rightTotal.clinic),
    )
  }, [sortedExecutions, translate])
  const statusTotalLabel = translate('stats.status.totalLabel')
  const jobTotalLabel = translate('stats.jobs.totalLabel')

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-semibold tracking-tight">{translate('title')}</h1>
          <p className="max-w-3xl text-muted-foreground">{translate('description', { app: target.label })}</p>
        </div>
        <Button nativeButton={false} render={<Link to={getPathWithExecutionTarget('/create')} />}>
          <IconPlus data-icon="inline-start" />
          {translate('createExecution')}
        </Button>
      </div>

      {statsQuery.isError || executionsQuery.isError ? (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertTitle>{translate('loadErrorTitle')}</AlertTitle>
          <AlertDescription>{translate('loadErrorDescription')}</AlertDescription>
          <Button
            className="mt-3 w-fit"
            size="sm"
            variant="outline"
            onClick={() => {
              void statsQuery.refetch()
              void executionsQuery.refetch()
            }}
          >
            {translate('retry')}
          </Button>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>{translate('stats.status.title')}</CardTitle>
            <CardDescription>{translate('stats.status.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {executionsQuery.isLoading ? (
              <Skeleton className="h-[260px] w-full rounded-2xl" />
            ) : (
              <ChartContainer config={statusChartConfig} className="mx-auto aspect-square max-h-[260px]">
                <PieChart accessibilityLayer>
                  <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="status" />} />
                  <Pie data={statusChartData} dataKey="total" nameKey="status" innerRadius={64} strokeWidth={4}>
                    {statusChartData.map((item) => (
                      <Cell key={item.status} fill={item.fill} />
                    ))}
                    <Label content={renderDonutCenterLabel(statusExecutionTotal, statusTotalLabel)} />
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>{translate('stats.jobs.title')}</CardTitle>
            <CardDescription>{translate('stats.jobs.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {statsQuery.isLoading ? (
              <Skeleton className="h-[260px] w-full rounded-2xl" />
            ) : (
              <ChartContainer config={jobChartConfig} className="mx-auto aspect-square max-h-[260px]">
                <PieChart accessibilityLayer>
                  <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="status" />} />
                  <Pie data={jobChartData} dataKey="total" nameKey="status" innerRadius={64} strokeWidth={4}>
                    {jobChartData.map((item) => (
                      <Cell key={item.status} fill={item.fill} />
                    ))}
                    <Label content={renderDonutCenterLabel(jobTotal, jobTotalLabel)} />
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>{translate('stats.clientClinic.title')}</CardTitle>
            <CardDescription>{translate('stats.clientClinic.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {executionsQuery.isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }, (_, index) => (
                  <Skeleton key={index} className="h-10 w-full rounded-2xl" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translate('stats.clientClinic.columns.client')}</TableHead>
                    <TableHead>{translate('stats.clientClinic.columns.clinic')}</TableHead>
                    <TableHead className="w-20 text-right">{translate('stats.clientClinic.columns.total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientClinicTotals.length > 0 ? (
                    clientClinicTotals.map((item) => (
                      <TableRow key={`${item.client}-${item.clinic}`}>
                        <TableCell className="font-medium whitespace-normal break-words">{item.client}</TableCell>
                        <TableCell className="whitespace-normal break-words">{item.clinic}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatNumber(item.total)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="h-28 text-center text-muted-foreground" colSpan={3}>
                        {translate('stats.clientClinic.empty')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle>{translate('latest.title')}</CardTitle>
          <CardDescription>{translate('latest.description')}</CardDescription>
          <CardAction>
            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              render={<Link to={getPathWithExecutionTarget('/executions')} />}
            >
              {translate('latest.viewAll')}
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
                  <TableHead className="w-28 whitespace-normal">{translate('latest.columns.execution')}</TableHead>
                  <TableHead className="w-28">{translate('latest.columns.status')}</TableHead>
                  <TableHead className="hidden whitespace-normal lg:table-cell">
                    {translate('latest.columns.client')}
                  </TableHead>
                  <TableHead className="hidden whitespace-normal lg:table-cell">
                    {translate('latest.columns.clinic')}
                  </TableHead>
                  <TableHead className="hidden whitespace-normal xl:table-cell">
                    {translate('latest.columns.project')}
                  </TableHead>
                  <TableHead className="hidden w-28 whitespace-normal md:table-cell">
                    {translate('latest.columns.createdAt')}
                  </TableHead>
                  <TableHead className="w-20 text-right">{translate('latest.columns.actions')}</TableHead>
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
                          {displayNames.client || translate('latest.emptyValue')}
                        </TableCell>
                        <TableCell className="hidden whitespace-normal break-words lg:table-cell">
                          {displayNames.clinic || translate('latest.emptyValue')}
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
                              <span className="sr-only sm:not-sr-only">{translate('latest.viewDetails')}</span>
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
                      {translate('latest.empty')}
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
