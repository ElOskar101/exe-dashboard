import { describe, expect, it } from 'vitest'
import { executionWizardSteps } from './use-execution-wizard'

describe('executionWizardSteps', () => {
  it('only exposes the patients, config, and review steps', () => {
    expect(executionWizardSteps).toEqual(['patients', 'config', 'review'])
  })
})
