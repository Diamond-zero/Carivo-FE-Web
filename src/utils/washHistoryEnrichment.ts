import type { ApiBooking, ApiWashHistory } from '../types/api/staff'
import type { WashHistory } from '../types/washHistory'
import { mapApiWashHistory, resolveWashHistoryLicensePlate } from '../lib/mappers/staffMappers'

/**
 * Wash history BE đã populate sẵn `customer`, `vehicle`, `service_package` và
 * `license_plate` cho từng bản ghi. Mapper `resolveWashHistoryLicensePlate`
 * sẽ ưu tiên các giá trị nested trước khi fallback sang booking.
 *
 * Hàm này giữ để tương thích ngược với code cũ; hiện không còn gọi API booking
 * thêm vì đã gây lỗi STAFF_GARAGE_ACCESS_DENIED khi staff ở garage khác xem
 * wash history cũ và đã có đủ thông tin từ payload BE trả về.
 */
export async function mapWashHistoriesWithBookingFallback(
  histories: ApiWashHistory[],
  _cachedBookings: ApiBooking[] = [],
): Promise<WashHistory[]> {
  void _cachedBookings
  return histories.map((item) => mapApiWashHistory(item))
}

export async function fetchWashHistoryBookingFallback(
  item: ApiWashHistory,
): Promise<ApiBooking | null> {
  if (resolveWashHistoryLicensePlate(item)) return null
  return null
}