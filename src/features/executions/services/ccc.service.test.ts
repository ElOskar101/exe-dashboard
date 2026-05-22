import { describe, expect, it, vi, beforeEach } from 'vitest'
import cccClient from '@/lib/axios'
import { getCustomerById, searchCustomers } from './ccc.service'

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

    expect(cccClient.get).toHaveBeenCalledWith('/api/v2/customers', {
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

    expect(cccClient.get).toHaveBeenCalledWith('/api/v2/customers/customer-1')
  })
})
