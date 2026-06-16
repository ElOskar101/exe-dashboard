import { beforeEach, describe, expect, it, vi } from 'vitest'
import cccClient, { exeClient, exeReportsClient } from '@/lib/axios'
import {
  addPlaywrightRuntimeShareMembers,
  createPlaywrightRuntime,
  createExecution,
  deleteExecution,
  deletePlaywrightRuntime,
  getExecutionAppStats,
  getExecutionById,
  getPlaywrightProjectById,
  getPlaywrightProjects,
  getPlaywrightRuntimeResponseData,
  getPlaywrightRuntimeById,
  getPlaywrightRuntimes,
  getExecutionReportHtml,
  getExecutions,
  pauseExecution,
  removePlaywrightRuntimeShareMembers,
  resumeExecution,
  scheduleExecution,
  stopExecution,
  updateExecution,
  updatePlaywrightRuntime,
} from './execution.service'
import type { ExecutionCreatePayload } from '../model/execution-create-payload'

vi.mock('@/lib/axios', () => ({
  default: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
  exeClient: {
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
  exeReportsClient: {
    get: vi.fn(),
  },
}))

const executionPayload: ExecutionCreatePayload = {
  project: 'elg-regression',
  createdBy: 'Jane Doe',
  client: 'Legacy Dental Care',
  clinic: 'Main Clinic',
  botName: 'eligibility-bot',
  meta: {
    bot: {
      botName: 'eligibility-bot',
      targetUrl: 'https://portal.example.com',
      username: 'runner',
      password: 'secret',
      otherInformation: {},
    },
    patients: [],
    config: {},
    rv: {},
    workers: 1,
    retries: 0,
  },
}

const runtimeTarget = {
  apiUrl: 'https://runtime.example.com/api/v1',
  reportsUrl: 'https://runtime.example.com/reports',
  socketUrl: 'https://runtime.example.com',
}

describe('execution.service', () => {
  beforeEach(() => {
    vi.mocked(cccClient.delete).mockReset()
    vi.mocked(cccClient.get).mockReset()
    vi.mocked(cccClient.post).mockReset()
    vi.mocked(cccClient.put).mockReset()
    vi.mocked(exeClient.delete).mockReset()
    vi.mocked(exeClient.get).mockReset()
    vi.mocked(exeClient.patch).mockReset()
    vi.mocked(exeClient.post).mockReset()
    vi.mocked(exeReportsClient.get).mockReset()
  })

  it('getExecutions requests the executions list', async () => {
    vi.mocked(exeClient.get).mockResolvedValueOnce({ data: [] })

    await getExecutions(runtimeTarget)

    expect(exeClient.get).toHaveBeenCalledWith('executions', {
      baseURL: 'https://runtime.example.com/api/v1',
    })
  })

  it('getExecutions sends supported filters as query params', async () => {
    vi.mocked(exeClient.get).mockResolvedValueOnce({ data: [] })

    await getExecutions(runtimeTarget, {
      by: ['user-2', 'user-1'],
      client: ['client-1'],
      clinic: ['clinic-1'],
      execution: ['execution-1'],
      bot: ['bot-1'],
      project: 'elg-regression',
      from: new Date('2026-05-01T00:00:00.000Z'),
      to: new Date('2026-05-31T23:59:59.000Z'),
      dateField: 'createdAt',
      status: 'cancelled',
      limit: 15,
    })

    const [, config] = vi.mocked(exeClient.get).mock.calls[0]
    const params = config?.params as URLSearchParams

    expect(exeClient.get).toHaveBeenCalledWith('executions', {
      baseURL: 'https://runtime.example.com/api/v1',
      params,
    })
    expect(params.getAll('by')).toEqual(['user-1', 'user-2'])
    expect(params.getAll('client')).toEqual(['client-1'])
    expect(params.getAll('clinic')).toEqual(['clinic-1'])
    expect(params.getAll('execution')).toEqual(['execution-1'])
    expect(params.getAll('bot')).toEqual(['bot-1'])
    expect(params.get('project')).toBe('elg-regression')
    expect(params.get('from')).toBe('2026-05-01T00:00:00.000Z')
    expect(params.get('to')).toBe('2026-05-31T23:59:59.000Z')
    expect(params.get('dateField')).toBe('createdAt')
    expect(params.get('status')).toBe('cancelled')
    expect(params.get('limit')).toBe('15')
  })

  it('createExecution posts to a selected runtime application API URL', async () => {
    vi.mocked(exeClient.post).mockResolvedValueOnce({ data: { _id: 'exe-1' } })

    await createExecution(executionPayload, runtimeTarget)

    expect(exeClient.post).toHaveBeenCalledWith('executions', executionPayload, {
      baseURL: 'https://runtime.example.com/api/v1',
    })
  })

  it('scheduleExecution posts to the selected runtime application schedule endpoint', async () => {
    vi.mocked(exeClient.post).mockResolvedValueOnce({ data: { _id: 'exe-1' } })

    await scheduleExecution(
      {
        ...executionPayload,
        scheduledAt: '2026-06-03T15:52:00.000Z',
      },
      runtimeTarget,
    )

    expect(exeClient.post).toHaveBeenCalledWith(
      'executions/schedule',
      {
        ...executionPayload,
        scheduledAt: '2026-06-03T15:52:00.000Z',
      },
      {
        baseURL: 'https://runtime.example.com/api/v1',
      },
    )
  })

  it('getExecutionById requests execution details with logs from the selected app', async () => {
    vi.mocked(exeClient.get).mockResolvedValueOnce({ data: { _id: 'exe-1' } })

    await getExecutionById('exe-1', runtimeTarget)

    expect(exeClient.get).toHaveBeenCalledWith('executions/exe-1', {
      baseURL: 'https://runtime.example.com/api/v1',
    })
  })

  it('getExecutionAppStats requests stats from a selected runtime application API URL', async () => {
    vi.mocked(exeClient.get).mockResolvedValueOnce({ data: { status: 'ok' } })

    await getExecutionAppStats(runtimeTarget)

    expect(exeClient.get).toHaveBeenCalledWith('stats', {
      baseURL: 'https://runtime.example.com/api/v1',
    })
  })

  it('getPlaywrightProjects requests the playwright project catalog', async () => {
    vi.mocked(cccClient.get).mockResolvedValueOnce({ data: [] })

    await getPlaywrightProjects()

    expect(cccClient.get).toHaveBeenCalledWith('v2/playwright-projects')
  })

  it('getPlaywrightProjectById requests the selected playwright project', async () => {
    vi.mocked(cccClient.get).mockResolvedValueOnce({ data: { _id: 'project-1' } })

    await getPlaywrightProjectById('project-1')

    expect(cccClient.get).toHaveBeenCalledWith('v2/playwright-projects/project-1')
  })

  it('getPlaywrightRuntimes requests the playwright runtime catalog', async () => {
    vi.mocked(cccClient.get).mockResolvedValueOnce({ data: [] })

    await getPlaywrightRuntimes()

    expect(cccClient.get).toHaveBeenCalledWith('v2/playwright-runtimes')
  })

  it('getPlaywrightRuntimeById requests the selected playwright runtime', async () => {
    vi.mocked(cccClient.get).mockResolvedValueOnce({ data: { _id: 'runtime-1' } })

    await getPlaywrightRuntimeById('runtime-1')

    expect(cccClient.get).toHaveBeenCalledWith('v2/playwright-runtimes/runtime-1')
  })

  it('getPlaywrightRuntimeResponseData normalizes shared members to member ids', () => {
    const runtime = getPlaywrightRuntimeResponseData({
      data: {
        _id: 'runtime-1',
        name: 'Runtime 1',
        accessInfo: {
          type: 'private',
          sharedWith: [
            {
              _id: 'member-1',
              fullName: 'Ada Lovelace',
              username: 'adal',
            },
          ],
        },
        applications: [
          {
            name: 'App 1',
            accessInfo: {
              type: 'private',
              sharedWith: [
                'member-2',
                {
                  _id: 'member-3',
                  username: 'graceh',
                },
              ],
            },
          },
        ],
      },
      success: true,
    })

    expect(runtime.accessInfo.sharedWith).toEqual(['member-1'])
    expect(runtime.applications?.[0]?.accessInfo.sharedWith).toEqual(['member-2', 'member-3'])
  })

  it('createPlaywrightRuntime posts a playwright runtime payload', async () => {
    const payload = {
      name: 'VPS~1',
      accessInfo: { type: 'private' as const },
      applications: [
        {
          name: 'Bare',
          active: true,
          nonProduction: false,
          accessInfo: { type: 'private' as const },
          config: {
            maxWorkers: 10,
            maxRetries: 3,
          },
        },
      ],
    }
    vi.mocked(cccClient.post).mockResolvedValueOnce({ data: { data: { _id: 'runtime-1' }, success: true } })

    await createPlaywrightRuntime(payload)

    expect(cccClient.post).toHaveBeenCalledWith('v2/playwright-runtimes', payload)
  })

  it('updatePlaywrightRuntime puts the full runtime payload', async () => {
    const payload = {
      name: 'Runtime 1',
      accessInfo: { type: 'private' as const, sharedWith: [] },
      applications: [
        {
          name: 'Bare',
          accessInfo: { type: 'private' as const },
        },
      ],
    }
    vi.mocked(cccClient.put).mockResolvedValueOnce({ data: { data: { _id: 'runtime-1' }, success: true } })

    await updatePlaywrightRuntime('runtime-1', payload)

    expect(cccClient.put).toHaveBeenCalledWith('v2/playwright-runtimes/runtime-1', payload)
  })

  it('deletePlaywrightRuntime deletes the selected playwright runtime', async () => {
    vi.mocked(cccClient.delete).mockResolvedValueOnce({ data: { success: true } })

    await deletePlaywrightRuntime('runtime-1')

    expect(cccClient.delete).toHaveBeenCalledWith('v2/playwright-runtimes/runtime-1')
  })

  it('addPlaywrightRuntimeShareMembers posts member ids to the runtime share endpoint', async () => {
    const payload = { memberIds: ['622f79263ccdc854030a3998'] }
    vi.mocked(cccClient.post).mockResolvedValueOnce({ data: { data: { _id: 'runtime-1' }, success: true } })

    await addPlaywrightRuntimeShareMembers('runtime-1', payload)

    expect(cccClient.post).toHaveBeenCalledWith('v2/playwright-runtimes/runtime-1/share', payload)
  })

  it('removePlaywrightRuntimeShareMembers sends member ids as a delete request body', async () => {
    const payload = { memberIds: ['622f79263ccdc854030a3998'] }
    vi.mocked(cccClient.delete).mockResolvedValueOnce({ data: { data: { _id: 'runtime-1' }, success: true } })

    await removePlaywrightRuntimeShareMembers('runtime-1', payload)

    expect(cccClient.delete).toHaveBeenCalledWith('v2/playwright-runtimes/runtime-1/share', { data: payload })
  })

  it('getExecutionReportHtml requests reports from a selected runtime application API URL', async () => {
    vi.mocked(exeReportsClient.get).mockResolvedValueOnce({ data: '<html></html>' })

    await getExecutionReportHtml('exe-1', runtimeTarget)

    expect(exeReportsClient.get).toHaveBeenCalledWith('exe-1/index.html', {
      baseURL: 'https://runtime.example.com/reports',
    })
  })

  it('updateExecution patches the selected execution', async () => {
    vi.mocked(exeClient.patch).mockResolvedValueOnce({ data: { _id: 'exe-1' } })

    await updateExecution('exe-1', { status: 'cancelled' }, runtimeTarget)

    expect(exeClient.patch).toHaveBeenCalledWith(
      'executions/exe-1',
      {
        status: 'cancelled',
      },
      {
        baseURL: 'https://runtime.example.com/api/v1',
      },
    )
  })

  it('deleteExecution deletes the selected execution', async () => {
    vi.mocked(exeClient.delete).mockResolvedValueOnce({
      data: { _id: 'exe-1' },
    })

    await deleteExecution('exe-1', runtimeTarget)

    expect(exeClient.delete).toHaveBeenCalledWith('executions/exe-1', {
      baseURL: 'https://runtime.example.com/api/v1',
    })
  })

  it('stopExecution posts to the execution stop endpoint', async () => {
    vi.mocked(exeClient.post).mockResolvedValueOnce({ data: { _id: 'exe-1' } })

    await stopExecution('exe-1', runtimeTarget)

    expect(exeClient.post).toHaveBeenCalledWith('executions/exe-1/stop', undefined, {
      baseURL: 'https://runtime.example.com/api/v1',
    })
  })

  it('pauseExecution posts to the execution pause endpoint', async () => {
    vi.mocked(exeClient.post).mockResolvedValueOnce({ data: { _id: 'exe-1' } })

    await pauseExecution('exe-1', runtimeTarget)

    expect(exeClient.post).toHaveBeenCalledWith('executions/exe-1/pause', undefined, {
      baseURL: 'https://runtime.example.com/api/v1',
    })
  })

  it('resumeExecution posts to the execution resume endpoint', async () => {
    vi.mocked(exeClient.post).mockResolvedValueOnce({ data: { _id: 'exe-1' } })

    await resumeExecution('exe-1', runtimeTarget)

    expect(exeClient.post).toHaveBeenCalledWith('executions/exe-1/resume', undefined, {
      baseURL: 'https://runtime.example.com/api/v1',
    })
  })
})
