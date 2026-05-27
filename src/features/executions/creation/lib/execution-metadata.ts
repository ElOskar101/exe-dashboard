import { z } from 'zod'
import type { ExecutionMetadata } from '../model/execution-create'

const executionMetadataSchema = z.record(z.string(), z.unknown())

export const parseExecutionMetadata = (value: string): ExecutionMetadata | null => {
  try {
    const parsed = JSON.parse(value)
    const result = executionMetadataSchema.safeParse(parsed)

    return result.success ? result.data : null
  } catch {
    return null
  }
}

export const isExecutionMetadataStringValid = (value: string) => {
  return parseExecutionMetadata(value) !== null
}
