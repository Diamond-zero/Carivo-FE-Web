import { getStaffBookingByIdApi } from '../api/booking.api'
import {
  mapApiWashHistory,
  resolveWashHistoryLicensePlate,
} from '../lib/mappers/staffMappers'
import type { ApiBooking, ApiWashHistory } from '../types/api/staff'
import type { WashHistory } from '../types/washHistory'

export async function mapWashHistoriesWithBookingFallback(
  histories: ApiWashHistory[],
  cachedBookings: ApiBooking[] = [],
): Promise<WashHistory[]> {
  const bookingsById = new Map(cachedBookings.map((booking) => [booking.id, booking]))

  const bookingIdsToFetch = [
    ...new Set(
      histories
        .filter(
          (item) =>
            !resolveWashHistoryLicensePlate(item, bookingsById.get(item.booking_id)),
        )
        .map((item) => item.booking_id),
    ),
  ]

  await Promise.all(
    bookingIdsToFetch.map(async (bookingId) => {
      try {
        const booking = await getStaffBookingByIdApi(bookingId)
        bookingsById.set(bookingId, booking)
      } catch {
        // Booking may no longer exist; keep wash history row as-is.
      }
    }),
  )

  return histories.map((item) =>
    mapApiWashHistory(item, bookingsById.get(item.booking_id)),
  )
}

export async function fetchWashHistoryBookingFallback(
  item: ApiWashHistory,
): Promise<ApiBooking | null> {
  if (resolveWashHistoryLicensePlate(item)) return null

  try {
    return await getStaffBookingByIdApi(item.booking_id)
  } catch {
    return null
  }
}
