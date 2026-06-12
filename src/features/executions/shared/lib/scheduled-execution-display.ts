import { intlFormatDistance, isValid, parseISO } from 'date-fns'
import type { Execution } from '../model/execution'

const FINAL_MINUTE_MS = 60_000
const SECOND_MS = 1000

export const getScheduledExecutionStartDate = (scheduledAt?: string | null) => {
  if (!scheduledAt?.trim()) return null

  const scheduledStartDate = parseISO(scheduledAt)

  return isValid(scheduledStartDate) ? scheduledStartDate : null
}

export const getScheduledExecutionStartTime = (scheduledAt?: string | null) => {
  const scheduledStartDate = getScheduledExecutionStartDate(scheduledAt)

  return scheduledStartDate?.getTime() ?? null
}

export const isScheduledExecution = (execution: Execution) => {
  return getScheduledExecutionStartDate(execution.scheduledAt) !== null
}

export const isWaitingScheduledExecution = (scheduledAt: string | null | undefined, currentTime: number) => {
  const scheduledStartTime = getScheduledExecutionStartTime(scheduledAt)

  return scheduledStartTime !== null && currentTime < scheduledStartTime
}

const formatClockCountdown = (remainingMs: number) => {
  const totalSeconds = Math.max(Math.ceil(remainingMs / SECOND_MS), 0)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export const getScheduledExecutionCountdownLabel = (scheduledAt: string | null | undefined, currentTime: number) => {
  const scheduledStartDate = getScheduledExecutionStartDate(scheduledAt)

  if (!scheduledStartDate) return null

  const remainingMs = scheduledStartDate.getTime() - currentTime

  if (remainingMs <= 0) return null
  if (remainingMs <= FINAL_MINUTE_MS) return `in ${formatClockCountdown(remainingMs)}`

  return intlFormatDistance(scheduledStartDate, currentTime, { numeric: 'always' })
}
