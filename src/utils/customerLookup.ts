import type { Booking } from '../types/booking'
import type { CustomerLoyalty } from '../types/loyalty'
import type { MockUser } from '../types/user'
import type { Vehicle } from '../types/vehicle'
import { mockCustomerLoyalty } from '../mocks/customerLoyalty'
import { mockCustomerUsers } from '../mocks/users'
import { mockLoyaltyPointHistory } from '../mocks/loyaltyPointHistory'
import { mockTierUpgradeHistory } from '../mocks/tierUpgradeHistory'
import { mockVehicles } from '../mocks/vehicles'
import { normalizeSearchText } from './booking'

export interface StaffCustomerSummary {
  user: MockUser
  loyalty: CustomerLoyalty
  garageBookingCount: number
  lastVisitAt: string | null
}

export function getCustomerById(customerId: string) {
  return mockCustomerUsers.find((user) => user.id === customerId)
}

export function getCustomerLoyalty(customerId: string) {
  return mockCustomerLoyalty.find((item) => item.customer_id === customerId)
}

export function getCustomerVehicles(customerId: string) {
  return mockVehicles.filter(
    (vehicle) => vehicle.customer_id === customerId && vehicle.is_active,
  )
}

export function getGarageBookingsForCustomer(
  customerId: string,
  bookings: Booking[],
  garageId: string,
) {
  return bookings
    .filter(
      (booking) =>
        booking.customer_id === customerId && booking.garage_id === garageId,
    )
    .sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
    )
}

export function getCustomersForGarage(
  bookings: Booking[],
  garageId: string,
): StaffCustomerSummary[] {
  const customerIds = new Set(
    bookings
      .filter((booking) => booking.garage_id === garageId && booking.customer_id)
      .map((booking) => booking.customer_id as string),
  )

  const summaries: StaffCustomerSummary[] = []

  for (const customerId of customerIds) {
    const user = getCustomerById(customerId)
    const loyalty = getCustomerLoyalty(customerId)
    if (!user || !loyalty) continue

    const garageBookings = getGarageBookingsForCustomer(
      customerId,
      bookings,
      garageId,
    )

    summaries.push({
      user,
      loyalty,
      garageBookingCount: garageBookings.length,
      lastVisitAt: garageBookings[0]?.start_time ?? null,
    })
  }

  return summaries.sort((a, b) =>
    a.user.full_name.localeCompare(b.user.full_name, 'vi'),
  )
}

export function searchCustomersForGarage(
  query: string,
  bookings: Booking[],
  garageId: string,
  vehicles: Vehicle[] = mockVehicles,
): StaffCustomerSummary[] {
  const normalizedQuery = normalizeSearchText(query.trim())
  const customers = getCustomersForGarage(bookings, garageId)

  if (!normalizedQuery) return customers

  return customers.filter((item) => {
    const name = normalizeSearchText(item.user.full_name)
    const phone = normalizeSearchText(item.user.phone)
    const email = normalizeSearchText(item.user.email ?? '')
    const customerVehicles = vehicles.filter(
      (vehicle) => vehicle.customer_id === item.user.id,
    )
    const plateMatch = customerVehicles.some((vehicle) =>
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

export function findCustomerByPlateAtGarage(
  plate: string,
  bookings: Booking[],
  garageId: string,
) {
  const normalizedPlate = normalizeSearchText(plate)
  const vehicle = mockVehicles.find((item) =>
    normalizeSearchText(item.raw_license_plate).includes(normalizedPlate),
  )
  if (!vehicle) return null

  const summary = getCustomersForGarage(bookings, garageId).find(
    (item) => item.user.id === vehicle.customer_id,
  )
  return summary ?? null
}

export function getTierUpgradeHistoryForCustomer(customerId: string) {
  return mockTierUpgradeHistory
    .filter((record) => record.customer_id === customerId)
    .sort(
      (a, b) =>
        new Date(b.upgraded_at).getTime() - new Date(a.upgraded_at).getTime(),
    )
}

export function getLoyaltyPointHistoryForCustomer(customerId: string) {
  return mockLoyaltyPointHistory
    .filter((record) => record.customer_id === customerId)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
}

export function isCustomerAtGarage(
  customerId: string,
  bookings: Booking[],
  garageId: string,
) {
  return getCustomersForGarage(bookings, garageId).some(
    (item) => item.user.id === customerId,
  )
}
