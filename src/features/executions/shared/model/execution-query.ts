export interface ExecutionQuery {
  by?: readonly string[]
  client?: readonly string[]
  clinic?: readonly string[]
  execution?: readonly string[]
  bot?: readonly string[]
  from?: Date
  to?: Date
  dateField?: string
  status?: string
  limit?: number
}

export type ExecutionArrayQueryKey = 'by' | 'client' | 'clinic' | 'execution' | 'bot'

export const EXECUTION_ARRAY_QUERY_KEYS = ['by', 'client', 'clinic', 'execution', 'bot'] as const

export interface NormalizedExecutionQuery {
  by?: readonly string[]
  client?: readonly string[]
  clinic?: readonly string[]
  execution?: readonly string[]
  bot?: readonly string[]
  from?: string
  to?: string
  dateField?: string
  status?: string
  limit?: number
}

const normalizeString = (value: string | undefined) => {
  const trimmedValue = value?.trim()

  return trimmedValue || undefined
}

const normalizeStringArray = (value: readonly string[] | undefined) => {
  const normalizedValues = value
    ?.map((item) => item.trim())
    .filter(Boolean)
    .sort()

  return normalizedValues && normalizedValues.length > 0 ? normalizedValues : undefined
}

const normalizeDate = (value: Date | undefined) => {
  if (!value) return undefined

  const time = value.getTime()

  return Number.isNaN(time) ? undefined : value.toISOString()
}

const normalizeLimit = (value: number | undefined) => {
  if (value === undefined) return undefined
  if (!Number.isInteger(value) || value <= 0) return undefined

  return value
}

export const normalizeExecutionQuery = (query: ExecutionQuery = {}): NormalizedExecutionQuery => {
  const normalizedQuery: NormalizedExecutionQuery = {}

  for (const key of EXECUTION_ARRAY_QUERY_KEYS) {
    const value = normalizeStringArray(query[key])

    if (value) {
      normalizedQuery[key] = value
    }
  }

  const from = normalizeDate(query.from)
  const to = normalizeDate(query.to)
  const dateField = normalizeString(query.dateField)
  const status = normalizeString(query.status)
  const limit = normalizeLimit(query.limit)

  if (from) normalizedQuery.from = from
  if (to) normalizedQuery.to = to
  if (dateField) normalizedQuery.dateField = dateField
  if (status) normalizedQuery.status = status
  if (limit) normalizedQuery.limit = limit

  return normalizedQuery
}
