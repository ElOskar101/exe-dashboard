import { format, isValid, parseISO } from 'date-fns'

export const formatExecutionDateTime = (value?: string) => {
  if (!value) {
    return '—'
  }

  const parsedDate = parseISO(value)

  if (!isValid(parsedDate)) {
    return value
  }

  return format(parsedDate, 'MMM d, yyyy, h:mm a')
}

export const formatExecutionDate = (value?: string) => {
  if (!value) {
    return '—'
  }

  const parsedDate = parseISO(value)

  if (!isValid(parsedDate)) {
    return value
  }

  return format(parsedDate, 'MMM d, yyyy')
}
