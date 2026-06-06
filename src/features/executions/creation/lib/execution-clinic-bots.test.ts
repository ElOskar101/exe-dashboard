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
    const clinicBotWithoutNestedBot = {
      ...createClinicBot(),
      _id: 'clinic-bot-4',
      bot: null,
    } as unknown as ClinicBotRecord

    expect(isClinicBotSelectable(activeClinicBot)).toBe(true)
    expect(isClinicBotSelectable(clinicBotWithoutNestedBot)).toBe(false)
    expect(
      getSelectableClinicBots([activeClinicBot, disabledClinicBot, inactiveNestedBot, clinicBotWithoutNestedBot]),
    ).toEqual([activeClinicBot])
  })

  it('sorts selectable clinic bots by bot name', () => {
    const zBot = createClinicBot({
      _id: 'clinic-bot-2',
      bot: {
        ...createClinicBot().bot,
        _id: 'bot-2',
        botName: 'Zion',
      },
    })
    const aBot = createClinicBot({
      _id: 'clinic-bot-3',
      bot: {
        ...createClinicBot().bot,
        _id: 'bot-3',
        botName: 'Aetna',
      },
    })
    const mBot = createClinicBot({
      _id: 'clinic-bot-4',
      bot: {
        ...createClinicBot().bot,
        _id: 'bot-4',
        botName: 'MetLife',
      },
    })

    expect(getSelectableClinicBots([zBot, mBot, aBot])).toEqual([aBot, mBot, zBot])
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

  it('can swap in the decrypted password without changing the rest of the mapped bot fields', () => {
    expect(mapClinicBotToExecutionBot(createClinicBot(), 'decrypted-secret')).toEqual({
      clinicBotId: 'clinic-bot-1',
      botName: 'Aetna',
      targetUrl: 'https://carrier.example.com',
      username: 'runner',
      password: 'decrypted-secret',
      verificationType: 'FBD',
    })
  })
})
