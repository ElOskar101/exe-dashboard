import { describe, expect, it } from 'vitest'
import type { PlaywrightProject } from '../../shared'
import {
  getSelectablePlaywrightProjectBots,
  mapPlaywrightProjectBotToExecutionBot,
} from './execution-playwright-projects'

const createProject = (overrides: Partial<PlaywrightProject> = {}): PlaywrightProject => ({
  _id: 'project-1',
  name: 'liberty',
  description: 'Not provided',
  associatedWith: [],
  ...overrides,
})

describe('execution playwright projects', () => {
  it('sorts active associated bots by bot name', () => {
    const project = createProject({
      associatedWith: [
        {
          _id: 'bot-2',
          botName: 'Zeta Dental',
          isActive: true,
          type: 'ELG',
          urlLogin: 'https://zeta.example.com',
        },
        {
          _id: 'bot-3',
          botName: 'Inactive Dental',
          isActive: false,
          type: 'ELG',
          urlLogin: 'https://inactive.example.com',
        },
        {
          _id: 'bot-1',
          botName: 'Alpha Dental',
          isActive: true,
          type: 'FBD',
          urlLogin: 'https://alpha.example.com',
        },
      ],
    })

    expect(getSelectablePlaywrightProjectBots(project).map((bot) => bot.botName)).toEqual([
      'Alpha Dental',
      'Zeta Dental',
    ])
  })

  it('maps a project-associated bot into editable execution bot defaults', () => {
    expect(
      mapPlaywrightProjectBotToExecutionBot({
        _id: 'bot-1',
        botName: 'Liberty Dental Plan',
        isActive: true,
        type: 'ELG',
        urlLogin: 'https://providerportal.libertydentalplan.com',
      }),
    ).toEqual({
      clinicBotId: 'bot-1',
      botName: 'Liberty Dental Plan',
      targetUrl: 'https://providerportal.libertydentalplan.com',
      username: '',
      password: '',
      verificationType: 'ELG',
    })
  })
})
