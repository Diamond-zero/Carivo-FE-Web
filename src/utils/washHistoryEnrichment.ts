import type { ApiBooking, ApiWashHistory } from '../types/api/staff'
import { getStaffBookingByIdApi } from '../api/booking.api'
import type { WashHistory } from '../types/washHistory'
import {
  mapApiWashHistory,
  resolveWashHistoryCustomerName,
  resolveWashHistoryCustomerPhone,
  resolveWashHistoryLicensePlate,
} from '../lib/mappers/staffMappers'

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
  const hasCustomerDetails = Boolean(
    resolveWashHistoryCustomerName(item) && resolveWashHistoryCustomerPhone(item),
  )
  const hasVehicleDetails = Boolean(resolveWashHistoryLicensePlate(item))

  // Walk-in information lives on Booking, not WashHistory: the BE intentionally
  // stores customer_id/vehicle_id as null for these records. Fetch the booking
  // only when the detail payload is incomplete, keeping the normal path cheap.
  if (hasCustomerDetails && hasVehicleDetails) return null

  try {
    return await getStaffBookingByIdApi(item.booking_id)
  } catch {
    // The history detail remains usable if the booking was removed or inaccessible.
    return null
  }
}