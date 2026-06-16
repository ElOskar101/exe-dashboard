import { describe, expect, it } from 'vitest'
import {
  decodeExecutionTargetValue,
  encodeExecutionTargetValue,
  getExecutionReportIndexUrl,
  getExecutionReportUrl,
  getExecutionTargetSearchSelection,
  hasPartialExecutionTargetSearchSelection,
  resolveExecutionTarget,
} from './execution-target'
import type { PlaywrightRuntime } from '../model/playwright-runtime'

const runtimeCreator = {
  _id: 'user-1',
  fullName: 'Runtime Creator',
}

const runtime: PlaywrightRuntime = {
  _id: 'runtime-1',
  name: 'Runtime 1',
  accessInfo: {
    createdBy: runtimeCreator,
    sharedWith: [],
    type: 'private',
  },
  applications: [
    {
      name: 'App 1',
      accessInfo: {
        createdBy: runtimeCreator,
        sharedWith: [],
        type: 'private',
      },
      apiUrl: 'https://runtime.example.com/api/v1/',
    },
  ],
}

describe('execution target', () => {
  it('resolves a runtime application selection to an execution target', () => {
    const target = resolveExecutionTarget(
      { runtimeId: 'runtime-1', applicationName: 'App 1', targetUrl: 'https://runtime.example.com/api/v1/' },
      [runtime],
    )

    expect(target.key).toBe('runtime:runtime-1:application:App 1')
    expect(target.label).toBe('App 1')
    expect(target.requestTarget.apiUrl).toBe('https://runtime.example.com/api/v1')
    expect(target.requestTarget.reportsUrl).toBe('https://runtime.example.com/reports')
  })

  it('normalizes bare runtime application API hosts to the execution API base URL', () => {
    const target = resolveExecutionTarget(
      {
        runtimeId: 'runtime-1',
        applicationName: 'Bare Host App',
        targetUrl: 'api.runtime.example.com',
      },
      undefined,
    )

    expect(target.requestTarget.apiUrl).toBe('https://api.runtime.example.com/api/v1')
    expect(target.requestTarget.reportsUrl).toBe('https://api.runtime.example.com/reports')
    expect(target.requestTarget.socketUrl).toBe('https://api.runtime.example.com')
  })

  it('resolves from targetUrl without requiring runtime catalog lookup', () => {
    const target = resolveExecutionTarget(
      {
        runtimeId: 'missing',
        applicationName: 'App 1',
        targetUrl: 'https://runtime.example.com/api/v1/',
      },
      [runtime],
    )

    expect(target.runtime).toBeUndefined()
    expect(target.application).toBeUndefined()
    expect(target.requestTarget.apiUrl).toBe('https://runtime.example.com/api/v1')
  })

  it('round-trips runtime application option values', () => {
    const selection = {
      runtimeId: 'runtime-1',
      applicationName: 'App 1',
      targetUrl: 'https://runtime.example.com/api/v1',
    }

    expect(decodeExecutionTargetValue(encodeExecutionTargetValue(selection))).toEqual(selection)
  })

  it('reads complete runtime selection query params', () => {
    expect(
      getExecutionTargetSearchSelection(
        new URLSearchParams('runtime=runtime-1&app=App+1&targetUrl=https%3A%2F%2Fruntime.example.com%2Fapi%2Fv1'),
      ),
    ).toEqual({
      runtimeId: 'runtime-1',
      applicationName: 'App 1',
      targetUrl: 'https://runtime.example.com/api/v1',
    })
    expect(getExecutionTargetSearchSelection(new URLSearchParams('runtime=runtime-1&app=App+1'))).toBeNull()
    expect(hasPartialExecutionTargetSearchSelection(new URLSearchParams('runtime=runtime-1&app=App+1'))).toBe(true)
  })

  it('builds the direct report URL from the selected reports endpoint', () => {
    expect(getExecutionReportUrl('https://api.runtime.example.com/reports', 'exe-1')).toBe(
      'https://api.runtime.example.com/reports/exe-1',
    )
  })

  it('builds the direct report index URL from the selected reports endpoint', () => {
    expect(getExecutionReportIndexUrl('https://api.runtime.example.com/reports', 'exe-1')).toBe(
      'https://api.runtime.example.com/reports/exe-1/index.html',
    )
  })
})
