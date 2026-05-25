import { describe, expect, it, vi, beforeEach } from 'vitest'
import cccClient from '@/lib/axios'
import { getCcExecution, getClinicExecutionDays, getCustomerById, searchCustomers } from './ccc.service'

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
