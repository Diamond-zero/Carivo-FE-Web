import type { ApiBooking, ApiWashHistory } from '../types/api/staff'
import type { WashHistory } from '../types/washHistory'
import { mapApiWashHistory, resolveWashHistoryLicensePlate } from '../lib/mappers/staffMappers'

/**
 * BE thường populate sẵn `customer`, `vehicle`, `service_package` và `license_plate`
 * cho từng bản ghi trả về; mapper `resolveWashHistoryLicensePlate` ưu tiên các giá
 * trị nested trước khi fallback sang booking tương ứng.
 *
 * Vì `getWashHistoriesApi` không JOIN ngược từ booking nên một số payload (nhất là
 * các bản ghi walk-in cũ hoặc cache cũ) thiếu cả `vehicle` lẫn `customer_name`.
 * Hàm này dùng `cachedBookings` đã load sẵn trong cùng garage (không gọi thêm API,
 * không yêu cầu staff khác garage) để fallback `license_plate` và `customer_name`
 * khi BE để trống.
 */
export async function mapWashHistoriesWithBookingFallback(
  histories: ApiWashHistory[],
  cachedBookings: ApiBooking[] = [],
): Promise<WashHistory[]> {
  const bookingById = new Map<string, ApiBooking>(
    cachedBookings.map((booking) => [booking.id, booking]),
  )

  return histories.map((item) => {
    const booking = bookingById.get(item.booking_id)
    return mapApiWashHistory(item, booking)
  })
}

export async function fetchWashHistoryBookingFallback(
  item: ApiWashHistory,
): Promise<ApiBooking | null> {
  if (resolveWashHistoryLicensePlate(item)) return null
  return null
}