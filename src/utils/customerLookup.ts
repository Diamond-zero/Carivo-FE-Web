import type { Booking } from '../types/booking'
import type { User } from '../types/user'
import type { Vehicle } from '../types/vehicle'
import { normalizeSearchText } from './booking'

export interface StaffCustomerSummary {
  user: User
  garageBookingCount: number
  lastVisitAt: string | null
  vehicles: Vehicle[]
}

function mapBookingCustomerToUser(booking: Booking): User | null {
  if (!booking.customer_id) return null

  return {
    id: booking.customer_id,
    full_name: booking.customer_name ?? 'Khách hàng',
    email: null,
    phone: booking.customer_phone ?? '',
    role: 'CUSTOMER',
    avatar_url: null,
    is_active: true,
  }
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
  const customerMap = new Map<string, StaffCustomerSummary>()

  for (const booking of bookings) {
    if (!booking.customer_id || booking.garage_id !== garageId) continue

    const user = mapBookingCustomerToUser(booking)
    if (!user) continue

    const existing = customerMap.get(booking.customer_id)
    const vehicle: Vehicle | null = booking.license_plate
      ? {
          id: booking.vehicle_id ?? `${booking.customer_id}-${booking.license_plate}`,
          customer_id: booking.customer_id,
          raw_license_plate: booking.license_plate,
          normalized_license_plate: normalizeSearchText(booking.license_plate),
          vehicle_type: booking.vehicle_type,
          engine_type: 'GASOLINE',
          motorbike_cc_group: null,
          car_body_type: null,
          seat_count: null,
          brand: null,
          model: null,
          color: null,
          is_default: false,
          is_active: true,
        }
      : null

    if (!existing) {
      customerMap.set(booking.customer_id, {
        user,
        garageBookingCount: 1,
        lastVisitAt: booking.start_time,
        vehicles: vehicle ? [vehicle] : [],
      })
      continue
    }

    existing.garageBookingCount += 1
    if (
      !existing.lastVisitAt ||
      new Date(booking.start_time).getTime() >
        new Date(existing.lastVisitAt).getTime()
    ) {
      existing.lastVisitAt = booking.start_time
      existing.user = user
    }

    if (
      vehicle &&
      !existing.vehicles.some(
        (item) => item.raw_license_plate === vehicle.raw_license_plate,
      )
    ) {
      existing.vehicles.push(vehicle)
    }
  }

  return Array.from(customerMap.values()).sort((a, b) =>
    a.user.full_name.localeCompare(b.user.full_name, 'vi'),
  )
}

export function getCustomerById(
  customerId: string,
  bookings: Booking[],
  garageId: string,
) {
  return getCustomersForGarage(bookings, garageId).find(
    (item) => item.user.id === customerId,
  )?.user
}

export function searchCustomersForGarage(
  query: string,
  bookings: Booking[],
  garageId: string,
): StaffCustomerSummary[] {
  const normalizedQuery = normalizeSearchText(query.trim())
  const customers = getCustomersForGarage(bookings, garageId)

  if (!normalizedQuery) return customers

  return customers.filter((item) => {
    const name = normalizeSearchText(item.user.full_name)
    const phone = normalizeSearchText(item.user.phone)
    const plateMatch = item.vehicles.some((vehicle) =>
      normalizeSearchText(vehicle.raw_license_plate).includes(normalizedQuery),
    )

    return (
      name.includes(normalizedQuery) ||
      phone.includes(normalizedQuery) ||
      plateMatch
    )
  })
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

export function getCustomerVehicles(
  customerId: string,
  bookings: Booking[],
  garageId: string,
) {
  return (
    getCustomersForGarage(bookings, garageId).find(
      (item) => item.user.id === customerId,
    )?.vehicles ?? []
  )
}
