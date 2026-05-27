import { describe, expect, it } from 'vitest'
import { executionWizardSteps } from './use-execution-wizard'

describe('executionWizardSteps', () => {
  it('only exposes the patients, bot, config, and review steps', () => {
    expect(executionWizardSteps).toEqual(['patients', 'bot', 'config', 'review'])
  })
})
