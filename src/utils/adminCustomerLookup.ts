import {
  getAdminCustomerById as getAdminCustomerRecord,
  mockAdminCustomers,
} from '../mocks/admin'
import { getAdminBookingsFromStore } from '../mocks/admin/adminBookingStore'
import { getCustomerActiveStatus } from '../mocks/admin/customerStatusOverrides'
import { mockLoyaltyPointHistory } from '../mocks/loyaltyPointHistory'
import { mockTierUpgradeHistory } from '../mocks/tierUpgradeHistory'
import { mockVehicles } from '../mocks/vehicles'
import type { Booking } from '../types/booking'
import type { CustomerLoyalty, LoyaltyTier } from '../types/loyalty'
import type { User } from '../types/user'
import { normalizeSearchText } from './booking'

export interface AdminCustomerSummary {
  user: User
  loyalty: CustomerLoyalty
  bookingCount: number
  is_active: boolean
}

export function getAdminCustomerSummaries(): AdminCustomerSummary[] {
  return mockAdminCustomers
    .map((record) => ({
      user: record.user,
      loyalty: record.loyalty,
      bookingCount: getAdminBookingsFromStore().filter(
        (booking) => booking.customer_id === record.user.id,
      ).length,
      is_active: getCustomerActiveStatus(record.user.id, record.user.is_active),
    }))
    .sort((a, b) => a.user.full_name.localeCompare(b.user.full_name, 'vi'))
}

export function searchAdminCustomers(
  query: string,
  tierFilter: LoyaltyTier | 'ALL' = 'ALL',
): AdminCustomerSummary[] {
  const normalizedQuery = normalizeSearchText(query.trim())
  let customers = getAdminCustomerSummaries()

  if (tierFilter !== 'ALL') {
    customers = customers.filter((item) => item.loyalty.current_tier === tierFilter)
  }

  if (!normalizedQuery) return customers

  return customers.filter((item) => {
    const name = normalizeSearchText(item.user.full_name)
    const phone = normalizeSearchText(item.user.phone)
    const email = normalizeSearchText(item.user.email ?? '')
    const plateMatch = mockVehicles
      .filter((vehicle) => vehicle.customer_id === item.user.id)
      .some((vehicle) =>
        normalizeSearchText(vehicle.raw_license_plate).includes(normalizedQuery),
      )

    return (
      name.includes(normalizedQuery) ||
      phone.includes(normalizedQuery) ||
      email.includes(normalizedQuery) ||
      plateMatch
    )
  })
}

export function getAdminCustomerUser(customerId: string) {
  return getAdminCustomerRecord(customerId)?.user
}

export function getAdminCustomerLoyalty(customerId: string) {
  return getAdminCustomerRecord(customerId)?.loyalty
}

export function getAdminCustomerVehicles(customerId: string) {
  return mockVehicles.filter(
    (vehicle) => vehicle.customer_id === customerId && vehicle.is_active,
  )
}

export function getAdminBookingsForCustomer(customerId: string): Booking[] {
  return getAdminBookingsFromStore()
    .filter((booking) => booking.customer_id === customerId)
    .sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
    )
}

export function getTierUpgradeHistoryForAdminCustomer(customerId: string) {
  return mockTierUpgradeHistory
    .filter((record) => record.customer_id === customerId)
    .sort(
      (a, b) =>
        new Date(b.upgraded_at).getTime() - new Date(a.upgraded_at).getTime(),
    )
}

export function getLoyaltyPointHistoryForAdminCustomer(customerId: string) {
  return mockLoyaltyPointHistory
    .filter((record) => record.customer_id === customerId)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
}
