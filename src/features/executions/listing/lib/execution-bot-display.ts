import type { Execution, ExecutionPayloadBot } from '@/features/executions/shared'

export const getExecutionBotName = (execution: Execution, emptyValue: string) =>
  execution.context.bot.botName.trim() || execution.botName?.trim() || execution.bot?.trim() || emptyValue

export const formatExecutionBotOtherInformation = (
  otherInformation: ExecutionPayloadBot['otherInformation'] | null | undefined,
  emptyValue: string,
) => {
  if (!otherInformation || Object.keys(otherInformation).length === 0) {
    return emptyValue
  }

  return JSON.stringify(otherInformation, null, 2)
}
