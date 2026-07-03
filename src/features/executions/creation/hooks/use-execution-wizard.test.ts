import { describe, expect, it } from 'vitest'
import { executionWizardSteps } from './use-execution-wizard'

describe('executionWizardSteps', () => {
  it('only exposes the general, config, and review steps', () => {
    expect(executionWizardSteps).toEqual(['general', 'config', 'review'])
  })
})
