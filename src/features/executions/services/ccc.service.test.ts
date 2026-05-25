import { describe, expect, it, vi, beforeEach } from 'vitest'
import cccClient from '@/lib/axios'
import { getCcExecution, getClinicBots, getClinicExecutionDays, getCustomerById, searchCustomers } from './ccc.service'

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

  it('getCcExecution requests the selected CC execution', async () => {
    vi.mocked(cccClient.get).mockResolvedValueOnce({
      data: {
        _id: 'day-1',
        sheetName: '2026-04-27',
        rows: [],
        trashed: false,
      },
    })

    await getCcExecution('day-1')

    expect(cccClient.get).toHaveBeenCalledWith('v2/executions/day-1')
  })
})
