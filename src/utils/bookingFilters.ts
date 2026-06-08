import type { Booking, BookingStatus } from '../types/booking'
import { getBookingPhone, normalizeSearchText } from './booking'

export interface BookingFilters {
  status: BookingStatus | 'ALL'
  date: string
  licensePlate: string
  phone: string
}

export const DEFAULT_BOOKING_FILTERS: BookingFilters = {
  status: 'ALL',
  date: '',
  licensePlate: '',
  phone: '',
}

export function filterBookings(
  bookings: Booking[],
  filters: BookingFilters,
): Booking[] {
  return bookings
    .filter((booking) => {
      if (filters.status !== 'ALL' && booking.status !== filters.status) {
        return false
      }

      if (filters.date && booking.booking_date !== filters.date) {
        return false
      }

      if (filters.licensePlate) {
        const query = normalizeSearchText(filters.licensePlate)
        const plate = normalizeSearchText(booking.license_plate)
        if (!plate.includes(query)) {
          return false
        }
      }

      if (filters.phone) {
        const query = normalizeSearchText(filters.phone)
        const phone = normalizeSearchText(getBookingPhone(booking))
        if (!phone.includes(query)) {
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
