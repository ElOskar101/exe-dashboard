import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exeClient } from '@/lib/axios'
import {
  createExecution,
  deleteExecution,
  getExecutionById,
  getExecutions,
  stopExecution,
  updateExecution,
} from './execution.service'
import { ExecutionCreatePayload } from '../model/execution-create'

vi.mock('@/lib/axios', () => ({
  exeClient: {
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}))

const executionPayload: ExecutionCreatePayload = {
  project: 'elg-regression',
  createdBy: 'user-1',
  client: 'client-1',
  clinic: 'clinic-1',
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
  })

  it('getExecutions requests the executions list', async () => {
    vi.mocked(exeClient.get).mockResolvedValueOnce({ data: [] })

    await getExecutions()

    expect(exeClient.get).toHaveBeenCalledWith('/executions')
  })

  it('createExecution posts the execution payload', async () => {
    vi.mocked(exeClient.post).mockResolvedValueOnce({ data: { _id: 'exe-1' } })

    await createExecution(executionPayload)

    expect(exeClient.post).toHaveBeenCalledWith('/executions', executionPayload)
  })

  it('getExecutionById requests execution details with logs', async () => {
    vi.mocked(exeClient.get).mockResolvedValueOnce({ data: { _id: 'exe-1' } })

    await getExecutionById('exe-1')

    expect(exeClient.get).toHaveBeenCalledWith('/executions/exe-1')
  })

  it('updateExecution patches the selected execution', async () => {
    vi.mocked(exeClient.patch).mockResolvedValueOnce({ data: { _id: 'exe-1' } })

    await updateExecution('exe-1', { status: 'cancelled' })

    expect(exeClient.patch).toHaveBeenCalledWith('/executions/exe-1', {
      status: 'cancelled',
    })
  })

  it('deleteExecution deletes the selected execution', async () => {
    vi.mocked(exeClient.delete).mockResolvedValueOnce({
      data: { _id: 'exe-1' },
    })

    await deleteExecution('exe-1')

    expect(exeClient.delete).toHaveBeenCalledWith('/executions/exe-1')
  })

  it('stopExecution posts to the execution stop endpoint', async () => {
    vi.mocked(exeClient.post).mockResolvedValueOnce({ data: { _id: 'exe-1' } })

    await stopExecution('exe-1')

    expect(exeClient.post).toHaveBeenCalledWith('/executions/exe-1/stop')
  })
})
