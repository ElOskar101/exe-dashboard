import type { ExecutionBot } from '../model/execution-create'
import type { ClinicBotRecord } from '../services/ccc.service'

export const isClinicBotSelectable = (clinicBot: ClinicBotRecord) => {
  return clinicBot.status.description === 'Active' && clinicBot.bot.isActive
}

export const getSelectableClinicBots = (clinicBots: ClinicBotRecord[]) => {
  return clinicBots
    .filter(isClinicBotSelectable)
    .sort((leftBot, rightBot) => leftBot.bot.botName.localeCompare(rightBot.bot.botName))
}

export const mapClinicBotToExecutionBot = (clinicBot: ClinicBotRecord): ExecutionBot => {
  return {
    clinicBotId: clinicBot._id,
    botName: clinicBot.bot.botName,
    targetUrl: clinicBot.bot.urlLogin,
    username: clinicBot.username,
    password: clinicBot.password,
    verificationType: clinicBot.bot.type,
  }
}
