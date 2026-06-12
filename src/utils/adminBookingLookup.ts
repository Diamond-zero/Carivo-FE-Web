import type { Booking, BookingStatus } from '../types/booking'
import type { VehicleType } from '../types/washBay'
import { getAdminBookingsFromStore } from '../mocks/admin/adminBookingStore'
import { normalizeSearchText } from './booking'
import { getAdminBookingPhone } from './adminBooking'

export interface AdminBookingFilters {
  garageId: string | 'ALL'
  status: BookingStatus | 'ALL'
  vehicleType: VehicleType | 'ALL'
  dateFrom: string
  dateTo: string
  query: string
}

export const DEFAULT_ADMIN_BOOKING_FILTERS: AdminBookingFilters = {
  garageId: 'ALL',
  status: 'ALL',
  vehicleType: 'ALL',
  dateFrom: '',
  dateTo: '',
  query: '',
}

export function searchAdminBookings(filters: AdminBookingFilters): Booking[] {
  const normalizedQuery = normalizeSearchText(filters.query.trim())

  return getAdminBookingsFromStore()
    .filter((booking) => {
      if (filters.garageId !== 'ALL' && booking.garage_id !== filters.garageId) {
        return false
      }

      if (filters.status !== 'ALL' && booking.status !== filters.status) {
        return false
      }

      if (filters.vehicleType !== 'ALL' && booking.vehicle_type !== filters.vehicleType) {
        return false
      }

      if (filters.dateFrom && booking.booking_date < filters.dateFrom) {
        return false
      }

      if (filters.dateTo && booking.booking_date > filters.dateTo) {
        return false
      }

      if (normalizedQuery) {
        const bookingId = normalizeSearchText(booking.id)
        const plate = normalizeSearchText(booking.license_plate)
        const phone = normalizeSearchText(getAdminBookingPhone(booking))

        if (
          !bookingId.includes(normalizedQuery) &&
          !plate.includes(normalizedQuery) &&
          !phone.includes(normalizedQuery)
        ) {
          return false
        }
      }

      return true
    })
    .sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
    )
}

export function hasActiveAdminBookingFilters(filters: AdminBookingFilters) {
  return (
    filters.garageId !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.vehicleType !== 'ALL' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.query.trim() !== ''
  )
}
