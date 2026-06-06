import type { PlaywrightProject, PlaywrightProjectBot } from '../../shared'
import type { ExecutionBot } from '../model/execution-create'
import type { ClinicBotRecord } from '../services/ccc.service'

const normalizeBotName = (botName: string) => botName.trim().toLowerCase()

export const getSelectablePlaywrightProjectBots = (project: PlaywrightProject | undefined) => {
  return (project?.associatedWith ?? [])
    .filter((bot) => bot.isActive)
    .sort((leftBot, rightBot) => leftBot.botName.localeCompare(rightBot.botName))
}

export const mapPlaywrightProjectBotToExecutionBot = (bot: PlaywrightProjectBot): ExecutionBot => ({
  clinicBotId: bot._id,
  botName: bot.botName,
  targetUrl: bot.urlLogin,
  username: '',
  password: '',
  verificationType: bot.type,
})

export const findClinicBotForPlaywrightProjectBot = (bot: PlaywrightProjectBot, clinicBots: ClinicBotRecord[]) => {
  const normalizedBotName = normalizeBotName(bot.botName)

  if (!normalizedBotName) {
    return undefined
  }

  return clinicBots.find((clinicBot) => normalizeBotName(clinicBot.bot.botName) === normalizedBotName)
}

export const mapPlaywrightProjectBotWithClinicBotToExecutionBot = (
  bot: PlaywrightProjectBot,
  clinicBot: ClinicBotRecord,
  password = clinicBot.password,
): ExecutionBot => ({
  clinicBotId: bot._id,
  botName: bot.botName,
  targetUrl: bot.urlLogin,
  username: clinicBot.username,
  password,
  verificationType: bot.type,
})
