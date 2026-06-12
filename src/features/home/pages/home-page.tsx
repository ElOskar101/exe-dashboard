import { IconAlertCircle, IconExternalLink } from '@tabler/icons-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { LabelProps } from 'recharts'
import { Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from 'recharts'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  EXECUTION_STATUSES,
  normalizeExecutionStatus,
  useExecutionTargetNavigation,
  useExecutionAppStatsQuery,
  useExecutionsQuery,
  type Execution,
  type ExecutionStatus,
} from '@/features/executions'
import { ExecutionsTable } from '@/features/executions/listing/components/executions-table'
import { getTopDimension, type TopDimensionEntry } from '@/features/home/lib/home-stats'

const LATEST_EXECUTIONS_LIMIT = 5
const TOP_DIMENSION_LABEL_MAX_LENGTH = 10
const CHART_HEIGHT_CLASS = 'h-[220px]'
const DONUT_CHART_CLASS = 'mx-auto size-[220px] max-w-full'

const formatNumber = (value: number | undefined) => new Intl.NumberFormat().format(value ?? 0)

const statusColorMap = {
  cancelled: 'oklch(44.6% 0.043 257.281)',
  completed: 'var(--success)',
  failed: 'var(--destructive)',
  paused: 'oklch(66.6% 0.179 58.318)',
  queued: 'var(--muted-foreground)',
  running: 'oklch(54.6% 0.245 262.881)',
  scheduled: 'oklch(60% 0.22 300)',
  unknown: 'var(--foreground)',
} as const satisfies Record<ExecutionStatus, string>

const jobColorMap = {
  completed: 'var(--success)',
  failed: 'var(--destructive)',
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
        <tspan x={center.cx} y={center.cy} className="fill-foreground text-2xl font-bold">
          {formatNumber(total)}
        </tspan>
        <tspan x={center.cx} y={center.cy + 22} className="fill-muted-foreground text-xs">
          {label}
        </tspan>
      </text>
    )
  }

const truncateLabel = (value: string, maxLength = 14) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value

export default function HomePage() {
  const { t: translate } = useTranslation('home')
  const { getPathWithExecutionTarget } = useExecutionTargetNavigation()
  const statsQuery = useExecutionAppStatsQuery()
  const executionsQuery = useExecutionsQuery()
  const shouldShowExecutionsFallback = executionsQuery.isLoading || executionsQuery.isError
  const shouldShowStatsFallback = statsQuery.isLoading || statsQuery.isError
  const sortedExecutions = useMemo(() => getSortedExecutions(executionsQuery.data), [executionsQuery.data])
  const latestExecutions = sortedExecutions.slice(0, LATEST_EXECUTIONS_LIMIT)
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
        completed: {
          label: translate('stats.jobs.labels.completed'),
          color: jobColorMap.completed,
        },
        failed: {
          label: translate('stats.jobs.labels.failed'),
          color: jobColorMap.failed,
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
      fill: 'var(--color-completed)',
      status: 'completed',
      total: statsQuery.data?.jobs.completed ?? 0,
    },
    {
      fill: 'var(--color-failed)',
      status: 'failed',
      total: statsQuery.data?.jobs.failed ?? 0,
    },
  ]
  const jobTotal = jobChartData.reduce((total, item) => total + item.total, 0)
  const noValueLabel = useMemo(() => translate('stats.top.noValue'), [translate])
  const topClients = useMemo(
    () => getTopDimension(sortedExecutions, (execution) => execution.client, noValueLabel),
    [sortedExecutions, noValueLabel],
  )
  const topClinics = useMemo(
    () => getTopDimension(sortedExecutions, (execution) => execution.clinic, noValueLabel),
    [sortedExecutions, noValueLabel],
  )
  const statusTotalLabel = translate('stats.status.totalLabel')
  const jobTotalLabel = translate('stats.jobs.totalLabel')
  const topEmptyLabel = translate('stats.top.empty')
  const topChartConfig = useMemo(
    () =>
      EXECUTION_STATUSES.reduce(
        (config, status) => ({
          ...config,
          [status]: {
            label: translate(`stats.status.labels.${status}`),
            color: statusColorMap[status],
          },
        }),
        {} satisfies ChartConfig,
      ),
    [translate],
  )
  const renderTopDimensionBarChart = (data: TopDimensionEntry[]) => {
    if (data.length === 0) {
      return (
        <div className={`flex ${CHART_HEIGHT_CLASS} items-center justify-center text-sm text-muted-foreground`}>
          {topEmptyLabel}
        </div>
      )
    }

    return (
      <ChartContainer config={topChartConfig} className={`${CHART_HEIGHT_CLASS} w-full`}>
        <BarChart data={data} accessibilityLayer margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value: string) => truncateLabel(value, TOP_DIMENSION_LABEL_MAX_LENGTH)}
            interval={0}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} width={32} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={(_value, payload) => payload?.[0]?.payload?.name ?? ''}
              />
            }
          />
          {EXECUTION_STATUSES.map((status) => (
            <Bar key={status} dataKey={status} stackId="executions" fill={`var(--color-${status})`} radius={4} />
          ))}
        </BarChart>
      </ChartContainer>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="sr-only">
        <h1>{translate('title')}</h1>
        <p>{translate('description', { app: 'Exe Dashboard' })}</p>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card size="sm" className="gap-3">
          <CardHeader>
            <CardTitle>{translate('stats.status.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {shouldShowExecutionsFallback ? (
              <Skeleton className={`${CHART_HEIGHT_CLASS} w-full rounded-2xl`} />
            ) : (
              <ChartContainer config={statusChartConfig} className={DONUT_CHART_CLASS}>
                <PieChart accessibilityLayer>
                  <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="status" />} />
                  <Pie
                    data={statusChartData}
                    dataKey="total"
                    nameKey="status"
                    innerRadius={56}
                    strokeWidth={4}
                    animationBegin={0}
                  >
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

        <Card size="sm" className="gap-3">
          <CardHeader>
            <CardTitle>{translate('stats.jobs.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {shouldShowStatsFallback ? (
              <Skeleton className={`${CHART_HEIGHT_CLASS} w-full rounded-2xl`} />
            ) : (
              <ChartContainer config={jobChartConfig} className={DONUT_CHART_CLASS}>
                <PieChart accessibilityLayer>
                  <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="status" />} />
                  <Pie
                    data={jobChartData}
                    dataKey="total"
                    nameKey="status"
                    innerRadius={56}
                    strokeWidth={4}
                    animationBegin={0}
                  >
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

        <Card size="sm" className="gap-3">
          <Tabs defaultValue="clients" className="gap-0">
            <CardHeader>
              <CardTitle>{translate('stats.top.title')}</CardTitle>
              {!shouldShowExecutionsFallback ? (
                <CardAction>
                  <TabsList className="group-data-horizontal/tabs:h-7 p-0.5">
                    <TabsTrigger value="clients" className="px-2.5 py-0.5 text-xs">
                      {translate('stats.top.tabs.clients')}
                    </TabsTrigger>
                    <TabsTrigger value="clinics" className="px-2.5 py-0.5 text-xs">
                      {translate('stats.top.tabs.clinics')}
                    </TabsTrigger>
                  </TabsList>
                </CardAction>
              ) : null}
            </CardHeader>
            <CardContent>
              {shouldShowExecutionsFallback ? (
                <Skeleton className={`${CHART_HEIGHT_CLASS} w-full rounded-2xl`} />
              ) : (
                <>
                  <TabsContent value="clients" className="mt-0">
                    {renderTopDimensionBarChart(topClients)}
                  </TabsContent>
                  <TabsContent value="clinics" className="mt-0">
                    {renderTopDimensionBarChart(topClinics)}
                  </TabsContent>
                </>
              )}
            </CardContent>
          </Tabs>
        </Card>
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle>{translate('latest.title')}</CardTitle>
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
          {shouldShowExecutionsFallback ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: LATEST_EXECUTIONS_LIMIT }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-2xl" />
              ))}
            </div>
          ) : null}

          {!shouldShowExecutionsFallback ? (
            <ExecutionsTable
              variant="latest"
              executions={latestExecutions}
              getStatusLabel={(status) => translate(`stats.status.labels.${status}`)}
              translations={{
                columns: {
                  project: translate('latest.columns.project'),
                  execution: translate('latest.columns.execution'),
                  status: translate('latest.columns.status'),
                  client: translate('latest.columns.client'),
                  clinic: translate('latest.columns.clinic'),
                  bot: translate('latest.columns.bot'),
                  createdAt: translate('latest.columns.createdAt'),
                },
                emptyValue: translate('latest.emptyValue'),
                empty: translate('latest.empty'),
              }}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
