import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exeClient, exeReportsClient } from '@/lib/axios'
import {
  createExecution,
  deleteExecution,
  getExecutionById,
  getExecutionReportHtml,
  getExecutions,
  pauseExecution,
  resumeExecution,
  stopExecution,
  updateExecution,
} from './execution.service'
import type { ExecutionCreatePayload } from '../model/execution-create-payload'

vi.mock('@/lib/axios', () => ({
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

describe('execution.service', () => {
  beforeEach(() => {
    vi.mocked(exeClient.delete).mockReset()
    vi.mocked(exeClient.get).mockReset()
    vi.mocked(exeClient.patch).mockReset()
    vi.mocked(exeClient.post).mockReset()
    vi.mocked(exeReportsClient.get).mockReset()
  })

  it('getExecutions requests the executions list', async () => {
    vi.mocked(exeClient.get).mockResolvedValueOnce({ data: [] })

    await getExecutions()

    expect(exeClient.get).toHaveBeenCalledWith('executions')
  })

  it('getExecutions sends supported filters as query params', async () => {
    vi.mocked(exeClient.get).mockResolvedValueOnce({ data: [] })

    await getExecutions({
      by: ['user-2', 'user-1'],
      client: ['client-1'],
      clinic: ['clinic-1'],
      execution: ['execution-1'],
      bot: ['bot-1'],
      from: new Date('2026-05-01T00:00:00.000Z'),
      to: new Date('2026-05-31T23:59:59.000Z'),
      dateField: 'createdAt',
      status: 'cancelled',
    })

    const [, config] = vi.mocked(exeClient.get).mock.calls[0]
    const params = config?.params as URLSearchParams

    expect(exeClient.get).toHaveBeenCalledWith('executions', { params })
    expect(params.getAll('by')).toEqual(['user-1', 'user-2'])
    expect(params.getAll('client')).toEqual(['client-1'])
    expect(params.getAll('clinic')).toEqual(['clinic-1'])
    expect(params.getAll('execution')).toEqual(['execution-1'])
    expect(params.getAll('bot')).toEqual(['bot-1'])
    expect(params.get('from')).toBe('2026-05-01T00:00:00.000Z')
    expect(params.get('to')).toBe('2026-05-31T23:59:59.000Z')
    expect(params.get('dateField')).toBe('createdAt')
    expect(params.get('status')).toBe('cancelled')
  })

  it('createExecution posts the execution payload', async () => {
    vi.mocked(exeClient.post).mockResolvedValueOnce({ data: { _id: 'exe-1' } })

    await createExecution(executionPayload)

    expect(exeClient.post).toHaveBeenCalledWith('executions', executionPayload)
  })

  it('getExecutionById requests execution details with logs', async () => {
    vi.mocked(exeClient.get).mockResolvedValueOnce({ data: { _id: 'exe-1' } })

    await getExecutionById('exe-1')

    expect(exeClient.get).toHaveBeenCalledWith('executions/exe-1')
  })

  it('getExecutionReportHtml requests the execution HTML report', async () => {
    vi.mocked(exeReportsClient.get).mockResolvedValueOnce({ data: '<html></html>' })

    await getExecutionReportHtml('exe-1')

    expect(exeReportsClient.get).toHaveBeenCalledWith('exe-1/index.html')
  })

  it('updateExecution patches the selected execution', async () => {
    vi.mocked(exeClient.patch).mockResolvedValueOnce({ data: { _id: 'exe-1' } })

    await updateExecution('exe-1', { status: 'cancelled' })

    expect(exeClient.patch).toHaveBeenCalledWith('executions/exe-1', {
      status: 'cancelled',
    })
  })

  it('deleteExecution deletes the selected execution', async () => {
    vi.mocked(exeClient.delete).mockResolvedValueOnce({
      data: { _id: 'exe-1' },
    })

    await deleteExecution('exe-1')

    expect(exeClient.delete).toHaveBeenCalledWith('executions/exe-1')
  })

  it('stopExecution posts to the execution stop endpoint', async () => {
    vi.mocked(exeClient.post).mockResolvedValueOnce({ data: { _id: 'exe-1' } })

    await stopExecution('exe-1')

    expect(exeClient.post).toHaveBeenCalledWith('executions/exe-1/stop')
  })

  it('pauseExecution posts to the execution pause endpoint', async () => {
    vi.mocked(exeClient.post).mockResolvedValueOnce({ data: { _id: 'exe-1' } })

    await pauseExecution('exe-1')

    expect(exeClient.post).toHaveBeenCalledWith('executions/exe-1/pause')
  })

  it('resumeExecution posts to the execution resume endpoint', async () => {
    vi.mocked(exeClient.post).mockResolvedValueOnce({ data: { _id: 'exe-1' } })

    await resumeExecution('exe-1')

    expect(exeClient.post).toHaveBeenCalledWith('executions/exe-1/resume')
  })
})
