import type { AdminCustomerRecord } from '../../types/admin'
import type { CustomerLoyalty, LoyaltyTier } from '../../types/loyalty'
import { mockCustomerLoyalty } from '../customerLoyalty'
import { mockCustomerUsers } from '../users'
import { mockAdminExtendedUsers } from './extendedUsers'

const tiers: LoyaltyTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']

const extendedLoyalty: CustomerLoyalty[] = mockAdminExtendedUsers
  .filter((user) => user.role === 'CUSTOMER')
  .map((user, index) => {
    const tier = tiers[index % tiers.length]
    const visits = 2 + (index % 12)
    const spent = visits * (80000 + index * 15000)

    return {
      customer_id: user.id,
      current_tier: tier,
      total_points: Math.round(spent / 1000),
      available_points: Math.round(spent / 1200),
      redeemed_points: index % 3 === 0 ? 100 : 0,
      expired_points: index % 5 === 0 ? 30 : 0,
      total_spent: spent,
      total_visits: visits,
      expiring_points:
        index % 4 === 0
          ? [{ points: 50 + index * 5, expires_at: '2026-11-30T23:59:59' }]
          : [],
    }
  })

export const mockAdminCustomerLoyalty: CustomerLoyalty[] = [
  ...mockCustomerLoyalty,
  ...extendedLoyalty,
]

function toUserRecord(user: (typeof mockCustomerUsers)[number]) {
  const { password: _password, ...rest } = user
  return rest
}

/** 20 khách hàng toàn hệ thống (4 Staff + 16 Admin mở rộng). */
export const mockAdminCustomers: AdminCustomerRecord[] = [
  ...mockCustomerUsers.map((user) => ({
    user: toUserRecord(user),
    loyalty: mockCustomerLoyalty.find((item) => item.customer_id === user.id)!,
  })),
  ...mockAdminExtendedUsers
    .filter((user) => user.role === 'CUSTOMER')
    .map((user) => ({
      user: toUserRecord(user),
      loyalty: extendedLoyalty.find((item) => item.customer_id === user.id)!,
    })),
]

export function getAdminCustomerById(customerId: string) {
  return mockAdminCustomers.find((record) => record.user.id === customerId)
}
