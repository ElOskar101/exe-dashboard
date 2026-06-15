import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AxiosResponse } from 'axios'
import { getAvailableRuntimeApplicationApiUrls, getRuntimeApplicationApiUrls } from './use-execution-target'
import { getExecutionAppStats } from '../services/execution.service'
import type { ExecutionAppStats } from '../model/app-stats'
import type { PlaywrightRuntime } from '../model/playwright-runtime'

vi.mock('../services/execution.service', () => ({
  getExecutionAppStats: vi.fn(),
  getPlaywrightProjects: vi.fn(),
  getPlaywrightRuntimeResponseData: vi.fn(),
  getPlaywrightRuntimes: vi.fn(),
  updatePlaywrightRuntime: vi.fn(),
}))

describe('runtime application availability', () => {
  const stats: ExecutionAppStats = {
    jobs: {
      active: 0,
      completed: 0,
      delayed: 0,
      failed: 0,
      paused: 0,
      prioritized: 0,
      queued: 0,
      running: 0,
      waiting: 0,
      waitingChildren: 0,
    },
    mongo: {
      readyState: 1,
      state: 'connected',
      status: 'ok',
    },
    redis: {
      status: 'ok',
    },
    server: {
      status: 'ok',
    },
    status: 'ok',
    timestamp: '2026-06-15T00:00:00.000Z',
    uptime: 1,
  }
  const statsResponse = { data: stats } as AxiosResponse<ExecutionAppStats>

  beforeEach(() => {
    vi.mocked(getExecutionAppStats).mockReset()
  })

  it('collects normalized unique runtime application API URLs', () => {
    const runtimes: PlaywrightRuntime[] = [
      {
        _id: 'runtime-1',
        accessInfo: { sharedWith: [], type: 'private' },
        applications: [
          {
            name: 'App 1',
            accessInfo: { sharedWith: [], type: 'private' },
            apiUrl: 'https://runtime.example.com',
          },
          {
            name: 'App 2',
            accessInfo: { sharedWith: [], type: 'private' },
            apiUrl: 'https://runtime.example.com/api/v1',
          },
          {
            name: 'App 3',
            accessInfo: { sharedWith: [], type: 'private' },
          },
        ],
        name: 'Runtime 1',
      },
    ]

    expect(getRuntimeApplicationApiUrls(runtimes)).toEqual(['https://runtime.example.com/api/v1'])
  })

  it('returns only API URLs whose stats endpoint responds successfully', async () => {
    vi.mocked(getExecutionAppStats)
      .mockResolvedValueOnce(statsResponse)
      .mockRejectedValueOnce(new Error('unavailable'))
      .mockResolvedValueOnce(statsResponse)

    await expect(
      getAvailableRuntimeApplicationApiUrls([
        'https://app-1.example.com/api/v1',
        'https://app-2.example.com/api/v1',
        'https://app-3.example.com/api/v1',
      ]),
    ).resolves.toEqual(['https://app-1.example.com/api/v1', 'https://app-3.example.com/api/v1'])

    expect(getExecutionAppStats).toHaveBeenCalledTimes(3)
    expect(getExecutionAppStats).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ apiUrl: 'https://app-1.example.com/api/v1' }),
    )
    expect(getExecutionAppStats).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ apiUrl: 'https://app-2.example.com/api/v1' }),
    )
    expect(getExecutionAppStats).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ apiUrl: 'https://app-3.example.com/api/v1' }),
    )
  })
})
