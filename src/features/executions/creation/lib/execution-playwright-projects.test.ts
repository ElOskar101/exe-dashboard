import { describe, expect, it } from 'vitest'
import type { PlaywrightProject } from '../../shared'
import {
  findClinicBotForPlaywrightProjectBot,
  getSelectablePlaywrightProjectBots,
  mapPlaywrightProjectBotToExecutionBot,
  mapPlaywrightProjectBotWithClinicBotToExecutionBot,
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

  it('finds the clinic bot whose nested bot name matches the project-associated bot even when ids differ', () => {
    const bot = {
      _id: 'bot-1',
      botName: 'Liberty Dental Plan',
      isActive: true,
      type: 'ELG' as const,
      urlLogin: 'https://providerportal.libertydentalplan.com',
    }
    const matchingClinicBot = {
      _id: 'clinic-bot-1',
      username: 'operator',
      password: 'secret',
      status: {
        _id: 'status-1',
        description: 'Active',
      },
      bot: {
        ...bot,
        status: {
          _id: 'status-1',
          description: 'Active',
        },
      },
    }

    expect(
      findClinicBotForPlaywrightProjectBot(bot, [
        {
          ...matchingClinicBot,
          _id: 'clinic-bot-2',
          username: 'other-operator',
          bot: {
            ...matchingClinicBot.bot,
            _id: 'bot-2',
            botName: 'Another Bot',
          },
        },
        matchingClinicBot,
      ]),
    ).toBe(matchingClinicBot)
  })

  it('matches clinic bots by trimmed bot name without case sensitivity', () => {
    const bot = {
      _id: 'bot-1',
      botName: '  Liberty Dental Plan  ',
      isActive: true,
      type: 'ELG' as const,
      urlLogin: 'https://providerportal.libertydentalplan.com',
    }
    const matchingClinicBot = {
      _id: 'clinic-bot-1',
      username: 'operator',
      password: 'secret',
      status: {
        _id: 'status-1',
        description: 'Active',
      },
      bot: {
        _id: 'legacy-bot-99',
        botName: 'liberty dental plan',
        isActive: true,
        type: 'ELG' as const,
        urlLogin: 'https://providerportal.libertydentalplan.com',
        status: {
          _id: 'status-1',
          description: 'Active',
        },
      },
    }

    expect(findClinicBotForPlaywrightProjectBot(bot, [matchingClinicBot])).toBe(matchingClinicBot)
  })

  it('maps a project-associated bot with matched clinic bot credentials', () => {
    expect(
      mapPlaywrightProjectBotWithClinicBotToExecutionBot(
        {
          _id: 'bot-1',
          botName: 'Liberty Dental Plan',
          isActive: true,
          type: 'ELG',
          urlLogin: 'https://providerportal.libertydentalplan.com',
        },
        {
          _id: 'clinic-bot-1',
          username: 'operator',
          password: 'secret',
          status: {
            _id: 'status-1',
            description: 'Active',
          },
          bot: {
            _id: 'bot-1',
            botName: 'Old Liberty Name',
            isActive: true,
            type: 'ELG',
            urlLogin: 'https://old.example.com',
            status: {
              _id: 'status-1',
              description: 'Active',
            },
          },
        },
      ),
    ).toEqual({
      clinicBotId: 'bot-1',
      botName: 'Liberty Dental Plan',
      targetUrl: 'https://providerportal.libertydentalplan.com',
      username: 'operator',
      password: 'secret',
      verificationType: 'ELG',
    })
  })

  it('can swap in the decrypted clinic bot password without changing the selected bot fields', () => {
    expect(
      mapPlaywrightProjectBotWithClinicBotToExecutionBot(
        {
          _id: 'bot-1',
          botName: 'Liberty Dental Plan',
          isActive: true,
          type: 'ELG',
          urlLogin: 'https://providerportal.libertydentalplan.com',
        },
        {
          _id: 'clinic-bot-1',
          username: 'operator',
          password: 'encrypted-secret',
          status: {
            _id: 'status-1',
            description: 'Active',
          },
          bot: {
            _id: 'bot-1',
            botName: 'Old Liberty Name',
            isActive: true,
            type: 'ELG',
            urlLogin: 'https://old.example.com',
            status: {
              _id: 'status-1',
              description: 'Active',
            },
          },
        },
        'decrypted-secret',
      ),
    ).toEqual({
      clinicBotId: 'bot-1',
      botName: 'Liberty Dental Plan',
      targetUrl: 'https://providerportal.libertydentalplan.com',
      username: 'operator',
      password: 'decrypted-secret',
      verificationType: 'ELG',
    })
  })
})
