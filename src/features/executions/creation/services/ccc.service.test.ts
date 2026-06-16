import { describe, expect, it, vi, beforeEach } from 'vitest'
import cccClient from '@/lib/axios'
import {
  decryptClinicBotPassword,
  getAllCustomers,
  getCCCExecution,
  getClinicBots,
  getClinicExecutionDays,
  getCustomerById,
  getRuntimeVariables,
  searchCustomers,
} from './ccc.service'

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('ccc.service', () => {
  beforeEach(() => {
    vi.mocked(cccClient.get).mockReset()
  })

  it('searchCustomers sends the clientName query param', async () => {
    vi.mocked(cccClient.get).mockResolvedValueOnce({
      data: {
        totalDocs: 0,
        totalPages: 0,
        query: {},
        customers: [],
      },
    })

    await searchCustomers('legacy')

    expect(cccClient.get).toHaveBeenCalledWith('v2/customers', {
      params: {
        clientName: 'legacy',
      },
    })
  })

  it('searchCustomers sends pagination params', async () => {
    vi.mocked(cccClient.get).mockResolvedValueOnce({
      data: {
        totalDocs: 0,
        totalPages: 0,
        query: {},
        customers: [],
      },
    })

    await searchCustomers('legacy', { limit: 15, page: 2 })

    expect(cccClient.get).toHaveBeenCalledWith('v2/customers', {
      params: {
        clientName: 'legacy',
        limit: 15,
        page: 2,
      },
    })
  })

  it('getAllCustomers requests each customer search page', async () => {
    vi.mocked(cccClient.get)
      .mockResolvedValueOnce({
        data: {
          totalDocs: 3,
          totalPages: 2,
          query: {},
          customers: [
            {
              _id: 'customer-1',
              clientName: 'Legacy Dental Care',
              isActive: true,
              createdAt: '2026-05-21T14:00:00.000Z',
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          totalDocs: 3,
          totalPages: 2,
          query: {},
          customers: [
            {
              _id: 'customer-2',
              clientName: 'Sunshine Dental',
              isActive: true,
              createdAt: '2026-05-22T14:00:00.000Z',
            },
            {
              _id: 'customer-3',
              clientName: 'Westside Dental',
              isActive: true,
              createdAt: '2026-05-23T14:00:00.000Z',
            },
          ],
        },
      })

    const response = await getAllCustomers()

    expect(cccClient.get).toHaveBeenNthCalledWith(1, 'v2/customers', {
      params: {
        clientName: '',
      },
    })
    expect(cccClient.get).toHaveBeenNthCalledWith(2, 'v2/customers', {
      params: {
        clientName: '',
        page: 2,
      },
    })
    expect(response.data.customers).toHaveLength(3)
  })

  it('getCustomerById requests the selected customer details', async () => {
    vi.mocked(cccClient.get).mockResolvedValueOnce({
      data: {
        _id: 'customer-1',
        clientName: 'Legacy Dental Care',
        isActive: true,
        clinic: [],
      },
    })

    await getCustomerById('customer-1')

    expect(cccClient.get).toHaveBeenCalledWith('v2/customers/customer-1')
  })

  it('getClinicExecutionDays requests execution days for the selected clinic', async () => {
    vi.mocked(cccClient.get).mockResolvedValueOnce({
      data: [
        {
          _id: 'day-1',
          sheetName: '2026-04-27',
          trashed: false,
        },
      ],
    })

    await getClinicExecutionDays('clinic-1')

    expect(cccClient.get).toHaveBeenCalledWith('v2/executions/clinic-1/days')
  })

  it('getClinicBots requests clinic bots for the selected clinic', async () => {
    vi.mocked(cccClient.get).mockResolvedValueOnce({
      data: [
        {
          _id: 'clinic-bot-1',
          status: {
            _id: 'status-1',
            description: 'Active',
          },
          username: 'runner',
          password: 'secret',
          bot: {
            _id: 'bot-1',
            botName: 'Aetna',
            isActive: true,
            status: {
              _id: 'bot-status-1',
              description: 'Developed',
            },
            type: 'FBD',
            urlLogin: 'https://carrier.example.com',
          },
        },
      ],
    })

    await getClinicBots('clinic-1')

    expect(cccClient.get).toHaveBeenCalledWith('v2/clinics/clinic-1/clinic-bots')
  })

  it('getCCCExecution requests the selected CC execution', async () => {
    vi.mocked(cccClient.get).mockResolvedValueOnce({
      data: {
        _id: 'day-1',
        sheetName: '2026-04-27',
        rows: [],
        trashed: false,
      },
    })

    await getCCCExecution('day-1')

    expect(cccClient.get).toHaveBeenCalledWith('v2/executions/day-1')
  })

  it('getRuntimeVariables requests the selected CCC runtime variables', async () => {
    vi.mocked(cccClient.get).mockResolvedValueOnce({
      data: {
        carrierDomain: 'dev-carrier',
      },
    })

    await getRuntimeVariables()

    expect(cccClient.get).toHaveBeenCalledWith('rv')
  })

  it('decryptClinicBotPassword requests the decrypted password as plain text', async () => {
    vi.mocked(cccClient.get).mockResolvedValueOnce({
      data: '"decrypted-password"',
    })

    const response = await decryptClinicBotPassword('clinic-bot-1')

    expect(cccClient.get).toHaveBeenCalledWith('clinicbots/decrypt/clinic-bot-1', {
      responseType: 'text',
    })
    expect(response.data).toBe('decrypted-password')
  })
})
