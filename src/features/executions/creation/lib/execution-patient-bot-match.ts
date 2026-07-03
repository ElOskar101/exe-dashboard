import type { ExecutionPatient, ExecutionWizardDraft } from '../model/execution-create'

const CASE_INSENSITIVE_REGEX_PREFIX = '(?i)'
const REGEX_PROPERTY_NAME = 'regex'

interface BotMacroConfig {
  regex?: string
}

const isBotMacroConfig = (value: unknown): value is BotMacroConfig => {
  return Boolean(value && typeof value === 'object' && REGEX_PROPERTY_NAME in value)
}

export const getSelectedBotCarrierRegex = (draft: ExecutionWizardDraft) => {
  const selectedBotConfig = draft.context.config?.[draft.bot.botName]

  if (!isBotMacroConfig(selectedBotConfig) || !selectedBotConfig.regex?.trim()) {
    return null
  }

  const trimmedRegex = selectedBotConfig.regex.trim()
  const hasCaseInsensitivePrefix = trimmedRegex.startsWith(CASE_INSENSITIVE_REGEX_PREFIX)
  const source = hasCaseInsensitivePrefix ? trimmedRegex.slice(CASE_INSENSITIVE_REGEX_PREFIX.length) : trimmedRegex

  try {
    return new RegExp(source, hasCaseInsensitivePrefix ? 'i' : undefined)
  } catch {
    return null
  }
}

export const isPatientEnabledForBot = (patient: ExecutionPatient, carrierRegex: RegExp | null) => {
  return !carrierRegex || carrierRegex.test(patient.carrierName)
}

export const getPatientsEnabledForBot = (draft: ExecutionWizardDraft) => {
  const carrierRegex = getSelectedBotCarrierRegex(draft)

  return draft.execution.patients.filter((patient) => isPatientEnabledForBot(patient, carrierRegex))
}
