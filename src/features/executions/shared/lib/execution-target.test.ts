import { describe, expect, it } from 'vitest'
import {
  DEFAULT_EXECUTION_TARGET_KEY,
  DEFAULT_EXECUTION_TARGET_LABEL,
  decodeExecutionTargetValue,
  encodeExecutionTargetValue,
  getExecutionTargetSearchSelection,
  resolveExecutionTarget,
} from './execution-target'
import type { PlaywrightRuntime } from '../model/playwright-runtime'

const runtime: PlaywrightRuntime = {
  _id: 'runtime-1',
  name: 'Runtime 1',
  applications: [
    {
      name: 'App 1',
      apiUrl: 'https://runtime.example.com/api/v1/',
    },
  ],
}

describe('execution target', () => {
  it('resolves a runtime application selection to an execution target', () => {
    const target = resolveExecutionTarget({ runtimeId: 'runtime-1', applicationName: 'App 1' }, [runtime])

    expect(target.type).toBe('runtime-application')
    expect(target.key).toBe('runtime:runtime-1:application:App 1')
    expect(target.label).toBe('App 1')
    expect(target.requestTarget?.apiUrl).toBe('https://runtime.example.com/api/v1')
    expect(target.requestTarget?.reportsUrl).toBe('https://runtime.example.com/reports')
  })

  it('normalizes bare runtime application API hosts to the execution API base URL', () => {
    const target = resolveExecutionTarget({ runtimeId: 'runtime-1', applicationName: 'Bare Host App' }, [
      {
        ...runtime,
        applications: [
          {
            name: 'Bare Host App',
            apiUrl: 'api.controlcentralcarrier.com',
          },
        ],
      },
    ])

    expect(target.type).toBe('runtime-application')
    expect(target.requestTarget?.apiUrl).toBe('https://api.controlcentralcarrier.com/api/v1')
    expect(target.requestTarget?.reportsUrl).toBe('https://api.controlcentralcarrier.com/reports')
    expect(target.requestTarget?.socketUrl).toBe('https://api.controlcentralcarrier.com')
  })

  it('uses the default target when URL params are missing or invalid', () => {
    expect(resolveExecutionTarget(null, [runtime])).toEqual({
      type: 'default',
      key: DEFAULT_EXECUTION_TARGET_KEY,
      label: DEFAULT_EXECUTION_TARGET_LABEL,
    })
    expect(resolveExecutionTarget({ runtimeId: 'missing', applicationName: 'App 1' }, [runtime])).toEqual({
      type: 'default',
      key: DEFAULT_EXECUTION_TARGET_KEY,
      label: DEFAULT_EXECUTION_TARGET_LABEL,
    })
  })

  it('round-trips runtime application option values', () => {
    const selection = { runtimeId: 'runtime-1', applicationName: 'App 1' }

    expect(decodeExecutionTargetValue(encodeExecutionTargetValue(selection))).toEqual(selection)
  })

  it('reads complete runtime selection query params', () => {
    expect(getExecutionTargetSearchSelection(new URLSearchParams('runtimeId=runtime-1&applicationName=App+1'))).toEqual(
      {
        runtimeId: 'runtime-1',
        applicationName: 'App 1',
      },
    )
    expect(getExecutionTargetSearchSelection(new URLSearchParams('runtimeId=runtime-1'))).toBeNull()
  })
})
