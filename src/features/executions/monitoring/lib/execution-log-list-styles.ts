import type { CSSProperties } from 'react'
import type { ExecutionLogStream } from './execution-log-buffer'
import type { ExecutionLogTone } from './execution-log-render'

export function getStreamClassName(stream: ExecutionLogStream | undefined) {
  switch (stream) {
    case 'stderr':
      return 'text-rose-600 dark:text-rose-300'
    case 'system':
      return 'text-sky-700 dark:text-sky-300'
    case 'stdout':
      return 'text-emerald-700 dark:text-emerald-300'
    default:
      return ''
  }
}

export function getToneClassName(tone: ExecutionLogTone | undefined) {
  switch (tone) {
    case 'destructive':
      return 'text-rose-600 dark:text-rose-300'
    case 'success':
      return 'text-emerald-700 dark:text-emerald-300'
    case 'warning':
      return 'text-amber-700 dark:text-amber-300'
    default:
      return ''
  }
}

export function getTextDecorationLine(decorations: string[]): CSSProperties['textDecorationLine'] {
  const textDecorations = decorations.filter(
    (decoration) => decoration === 'underline' || decoration === 'strikethrough',
  )

  if (textDecorations.length === 0) {
    return undefined
  }

  return textDecorations.join(' ') as CSSProperties['textDecorationLine']
}
