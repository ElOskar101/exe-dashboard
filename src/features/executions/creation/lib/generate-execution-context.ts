import type { TFunction } from 'i18next'
import type { CccApiEnvironment } from '@/app.config'
import type {
  ExecutionMetadata,
  ExecutionPayloadVerificationType,
  ExecutionVerificationType,
  Patient,
} from '../../shared/model/execution-create-payload'
import { hasErrors, isHttpUrl } from './execution-wizard-validation'

type ClinicContextData = ExecutionMetadata & {
  formConfigs?: ExecutionMetadata
}

export interface GenerateExecutionContextBot {
  clinicBotRecordId: string
  id: string
  botName: string
  targetUrl: string
  username: string
  password: string
  verificationType: ExecutionVerificationType | ''
}

export interface GenerateExecutionContextForm {
  clientId: string
  clientName: string
  clinicId: string
  clinicName: string
  executionId: string
  sheetName: string
  patients: Patient[]
  bot: GenerateExecutionContextBot
  workers: string
  retries: string
}

export interface GenerateExecutionContextInput {
  env: CccApiEnvironment
  form: GenerateExecutionContextForm
  clinicConfigData?: ClinicContextData
  workersLimit: number
  retriesLimit: number
}

export interface GeneratedExecutionContextBot {
  id?: string
  botName: string
  targetUrl: string
  username: string
  password: string
  verificationType?: ExecutionPayloadVerificationType
  otherInformation: ExecutionMetadata
}

/**
 * Context object produced for Playwright.
 * Fields that the Playwright context leaves optional, or only checks when present,
 * are omitted when the user leaves them empty.
 */
export interface GeneratedExecutionContext {
  executionId?: string
  sheetName?: string
  env: CccApiEnvironment
  bot: GeneratedExecutionContextBot
  clinicConfig?: ExecutionMetadata
  formConfigs?: ExecutionMetadata
  workers?: number
  retries?: number
  patients: Patient[]
}

export type GenerateExecutionContextFieldErrors = Partial<
  Record<'botName' | 'targetUrl' | 'username' | 'password' | 'workers' | 'retries', string>
>

const createEmptyBot = (): GenerateExecutionContextBot => ({
  clinicBotRecordId: '',
  id: '',
  botName: '',
  targetUrl: '',
  username: '',
  password: '',
  verificationType: '',
})

export const createEmptyGenerateExecutionContextForm = (): GenerateExecutionContextForm => ({
  clientId: '',
  clientName: '',
  clinicId: '',
  clinicName: '',
  executionId: '',
  sheetName: '',
  patients: [],
  bot: createEmptyBot(),
  workers: '',
  retries: '',
})

export const clearGenerateExecutionContextClinicDependents = (
  form: GenerateExecutionContextForm,
): GenerateExecutionContextForm => ({
  ...form,
  clinicId: '',
  clinicName: '',
  executionId: '',
  sheetName: '',
  patients: [],
  bot: form.bot.clinicBotRecordId ? createEmptyBot() : form.bot,
})

const parseOptionalWholeNumber = (value: string) => {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return undefined
  }

  return Number(trimmedValue)
}

export const getGenerateExecutionContextFieldErrors = (
  input: GenerateExecutionContextInput,
  t: TFunction<'executions'>,
): GenerateExecutionContextFieldErrors => {
  const errors: GenerateExecutionContextFieldErrors = {}
  const { bot, workers, retries } = input.form

  if (!bot.botName.trim()) {
    errors.botName = t('validation.required')
  }

  if (!bot.targetUrl.trim()) {
    errors.targetUrl = t('validation.required')
  } else if (!isHttpUrl(bot.targetUrl)) {
    errors.targetUrl = t('validation.validUrl')
  }

  if (!bot.username.trim()) {
    errors.username = t('validation.required')
  }

  if (!bot.password.trim()) {
    errors.password = t('validation.required')
  }

  const workersValue = parseOptionalWholeNumber(workers)

  if (workers.trim()) {
    if (workersValue === undefined || !Number.isInteger(workersValue) || workersValue <= 0) {
      errors.workers = t('validation.positiveNumber')
    } else if (workersValue > input.workersLimit) {
      errors.workers = t('validation.exceedsMax', { max: input.workersLimit })
    }
  }

  const retriesValue = parseOptionalWholeNumber(retries)

  if (retries.trim()) {
    if (retriesValue === undefined || !Number.isInteger(retriesValue) || retriesValue < 0) {
      errors.retries = t('validation.nonNegativeNumber')
    } else if (retriesValue > input.retriesLimit) {
      errors.retries = t('validation.exceedsMax', { max: input.retriesLimit })
    }
  }

  return errors
}

export const hasGenerateExecutionContextFieldErrors = (errors: GenerateExecutionContextFieldErrors) => hasErrors(errors)

/**
 * Builds the context object the execution wizard sends.
 *
 * Bot name, portal URL, username, and password are required by the Playwright context checks.
 * executionId, bot id, sheet name, clinic config, form configs, workers, and retries are included
 * only when the user provides them. accessToken and payloadConfigs are not part of the wizard context.
 */
export const buildGeneratedExecutionContext = (input: GenerateExecutionContextInput): GeneratedExecutionContext => {
  const { bot, executionId, patients, retries, sheetName, workers } = input.form
  const botId = bot.id.trim()
  const verificationType = bot.verificationType.toLowerCase() as ExecutionPayloadVerificationType
  const workersValue = parseOptionalWholeNumber(workers)
  const retriesValue = parseOptionalWholeNumber(retries)
  const context: GeneratedExecutionContext = {
    env: input.env,
    bot: {
      ...(botId ? { id: botId } : {}),
      botName: bot.botName.trim(),
      targetUrl: bot.targetUrl.trim(),
      username: bot.username.trim(),
      password: bot.password.trim(),
      ...(bot.verificationType ? { verificationType } : {}),
      otherInformation: {},
    },
    patients,
  }

  if (input.clinicConfigData) {
    const { formConfigs = {}, ...clinicConfig } = input.clinicConfigData

    context.clinicConfig = clinicConfig
    context.formConfigs = formConfigs
  }

  const trimmedExecutionId = executionId.trim()
  const trimmedSheetName = sheetName.trim()

  if (trimmedExecutionId) {
    context.executionId = trimmedExecutionId
  }

  if (trimmedSheetName) {
    context.sheetName = trimmedSheetName
  }

  if (workersValue !== undefined && Number.isInteger(workersValue)) {
    context.workers = workersValue
  }

  if (retriesValue !== undefined && Number.isInteger(retriesValue)) {
    context.retries = retriesValue
  }

  return context
}
