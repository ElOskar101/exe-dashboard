import {
  isExecutionPending,
  isExecutionSuccessful,
  normalizeExecutionStatus,
  type ExecutionStatus,
} from '@/features/executions/shared'

const RELATIVE_TIME_UNITS = [
  { unit: 'year', seconds: 60 * 60 * 24 * 365 },
  { unit: 'month', seconds: 60 * 60 * 24 * 30 },
  { unit: 'week', seconds: 60 * 60 * 24 * 7 },
  { unit: 'day', seconds: 60 * 60 * 24 },
  { unit: 'hour', seconds: 60 * 60 },
  { unit: 'minute', seconds: 60 },
] as const

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
})

export const getRelativeCreatedAt = (createdAt: string, currentTime: number) => {
  const createdAtTime = new Date(createdAt).getTime()

  if (Number.isNaN(createdAtTime)) return null

  const elapsedSeconds = Math.max(0, Math.floor((currentTime - createdAtTime) / 1000))
  const relativeUnit = RELATIVE_TIME_UNITS.find(({ seconds }) => elapsedSeconds >= seconds)

  if (!relativeUnit) return relativeTimeFormatter.format(0, 'second')

  return relativeTimeFormatter.format(-Math.floor(elapsedSeconds / relativeUnit.seconds), relativeUnit.unit)
}

export const getStatusDotClassName = (status: ExecutionStatus) => {
  if (isExecutionSuccessful(status)) return 'bg-green-500'
  if (normalizeExecutionStatus(status) === 'cancelled') return 'bg-slate-500'
  if (normalizeExecutionStatus(status) === 'paused') return 'bg-amber-500'
  if (isExecutionPending(status)) return 'bg-blue-500'

  return 'bg-red-500'
}
