import type { PlaywrightProject, PlaywrightProjectBot } from '../../shared'
import type { ExecutionBot } from '../model/execution-create'

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
