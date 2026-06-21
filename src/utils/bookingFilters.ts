import type { Booking, BookingStatus } from '../types/booking'
import type { BookingListParams } from '../api/booking.api'
import { getBookingPhone, normalizeSearchText } from './booking'
import { toApiDateTimeString } from './walkIn'

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

export function toBookingListApiParams(
  filters: BookingFilters,
  garageId?: string,
): BookingListParams {
  const params: BookingListParams = { limit: 100 }

  if (garageId) {
    params.garage_id = garageId
  }

  if (filters.status !== 'ALL') {
    params.status = filters.status
  }

  if (filters.date) {
    const dayStart = new Date(`${filters.date}T00:00:00`)
    const dayEnd = new Date(`${filters.date}T23:59:59`)
    params.from = toApiDateTimeString(dayStart)
    params.to = toApiDateTimeString(dayEnd)
  }

  const searchParts = [
    filters.licensePlate.trim(),
    filters.phone.trim(),
  ].filter(Boolean)

  if (searchParts.length > 0) {
    params.search = searchParts.join(' ')
  }

  return params
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
