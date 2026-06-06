import type { ExecutionBot } from '../model/execution-create'
import type { ClinicBotDefinition, ClinicBotRecord, ClinicBotStatus } from '../services/ccc.service'

export interface SelectableClinicBotRecord extends ClinicBotRecord {
  bot: ClinicBotDefinition
  status: ClinicBotStatus
}

export const isClinicBotSelectable = (clinicBot: ClinicBotRecord): clinicBot is SelectableClinicBotRecord => {
  return clinicBot.status?.description === 'Active' && clinicBot.bot?.isActive === true
}

export const getSelectableClinicBots = (clinicBots: ClinicBotRecord[]) => {
  return clinicBots
    .filter(isClinicBotSelectable)
    .sort((leftBot, rightBot) => leftBot.bot.botName.localeCompare(rightBot.bot.botName))
}

export const mapClinicBotToExecutionBot = (
  clinicBot: SelectableClinicBotRecord,
  password = clinicBot.password,
): ExecutionBot => {
  return {
    clinicBotId: clinicBot._id,
    botName: clinicBot.bot.botName,
    targetUrl: clinicBot.bot.urlLogin,
    username: clinicBot.username,
    password,
    verificationType: clinicBot.bot.type,
  }
}
