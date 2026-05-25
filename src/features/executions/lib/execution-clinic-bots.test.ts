import { describe, expect, it } from 'vitest'
import { getSelectableClinicBots, isClinicBotSelectable, mapClinicBotToExecutionBot } from './execution-clinic-bots'
import type { ClinicBotRecord } from '../services/ccc.service'

const createClinicBot = (overrides: Partial<ClinicBotRecord> = {}): ClinicBotRecord => ({
  _id: 'clinic-bot-1',
  status: {
    _id: 'status-1',
    description: 'Active',
  },
  username: 'runner',
  password: 'secret',
  bot: {
    _id: 'bot-1',
    botName: 'Aetna',
    isActive: true,
    status: {
      _id: 'bot-status-1',
      description: 'Developed',
    },
    type: 'FBD',
    urlLogin: 'https://carrier.example.com',
  },
  ...overrides,
})

describe('execution-clinic-bots', () => {
  it('only treats clinic bots with active record status and active nested bots as selectable', () => {
    const activeClinicBot = createClinicBot()
    const disabledClinicBot = createClinicBot({
      _id: 'clinic-bot-2',
      status: {
        _id: 'status-2',
        description: 'Disabled',
      },
    })
    const inactiveNestedBot = createClinicBot({
      _id: 'clinic-bot-3',
      bot: {
        ...createClinicBot().bot,
        _id: 'bot-3',
        isActive: false,
      },
    })

    expect(isClinicBotSelectable(activeClinicBot)).toBe(true)
    expect(getSelectableClinicBots([activeClinicBot, disabledClinicBot, inactiveNestedBot])).toEqual([activeClinicBot])
  })

  it('maps the selected clinic bot into the execution bot payload fields', () => {
    expect(mapClinicBotToExecutionBot(createClinicBot())).toEqual({
      clinicBotId: 'clinic-bot-1',
      botName: 'Aetna',
      targetUrl: 'https://carrier.example.com',
      username: 'runner',
      password: 'secret',
      verificationType: 'FBD',
    })
  })
})
