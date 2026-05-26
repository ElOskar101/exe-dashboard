import { describe, expect, it } from 'vitest'
import { createPendingBotSelection, executionWizardSteps } from './use-execution-wizard'

describe('executionWizardSteps', () => {
  it('only exposes the patients, bot, config, and review steps', () => {
    expect(executionWizardSteps).toEqual(['patients', 'bot', 'config', 'review'])
  })

  it('keeps bot inputs empty while the selected clinic bot password is still decrypting', () => {
    expect(createPendingBotSelection('clinic-bot-1')).toEqual({
      clinicBotId: 'clinic-bot-1',
      botName: '',
      targetUrl: '',
      username: '',
      password: '',
      verificationType: '',
    })
  })
})
