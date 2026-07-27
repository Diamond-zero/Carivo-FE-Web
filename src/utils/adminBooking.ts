import type { Booking } from '../types/booking'
import { getBookingCustomerName, getBookingPhone } from './booking'

export function getAdminBookingCustomerName(booking: Booking) {
  return getBookingCustomerName(booking)
}

export function getAdminBookingPhone(booking: Booking) {
  return getBookingPhone(booking)
}

/** Booking chưa thanh toán và chưa cộng điểm — admin có thể gọi reopen-service. */
export function canAdminReopenBooking(booking: Booking) {
  if (booking.status !== 'COMPLETED') return false
  if (booking.payment_status === 'PAID') return false
  const points = booking.earned_points ?? 0
  return points <= 0
}

export function getAdminBookingLateMinutes(booking: Booking) {
  return booking.raw?.late_minutes ?? 0
}

export function getAdminBookingGraceExceeded(booking: Booking) {
  return booking.raw?.grace_exceeded_minutes ?? 0
}

export function getAdminBookingArrivalStatus(booking: Booking) {
  return booking.raw?.arrival_status ?? null
}

export function getAdminBookingExceptionReason(booking: Booking): string | null {
  const raw = booking.raw
  if (!raw) return null
  if (raw.status === 'CANCELED') return decodeReasonCode(raw.cancel_reason ?? null)
  if (raw.status === 'NO_SHOW') return decodeReasonCode(raw.no_show_reason ?? null)
  if (raw.rescheduled_at) return decodeReasonCode(raw.reschedule_reason ?? null)
  if (raw.late_resolution_note) return raw.late_resolution_note
  return null
}

/**
 * Dictionary hiển thị lý do (reschedule / cancel / no-show) — BE backend lưu
 * dạng code enum, FE map sang nhãn tiếng Việt thân thiện. Nếu code không nằm
 * trong dictionary (ghi chú tự do hoặc code BE mới thêm) thì trả về nguyên
 * chuỗi — tránh mất thông tin.
 */
const REASON_CODE_LABELS: Record<string, string> = {
  CUSTOMER_EARLY_REQUEST: 'Khách đến sớm',
  STAFF_DELAY: 'Staff hoãn dịch vụ',
  CUSTOMER_CHANGE_MIND: 'Khách đổi ý',
  CUSTOMER_SCHEDULE_CONFLICT: 'Khách bận lịch',
  VEHICLE_NOT_READY: 'Xe chưa sẵn sàng',
  WEATHER_FORCE_MAJURE: 'Thời tiết xấu',
  GARAGE_INCIDENT: 'Sự cố garage',
  STAFF_UNAVAILABLE: 'Nhân viên không khả dụng',
  FORCE_MAJEURE: 'Bất khả kháng',
  NO_SHOW: 'Khách không đến',
  NO_SHOW_CUSTOMER_LATE: 'Khách đến quá trễ',
}

function decodeReasonCode(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return REASON_CODE_LABELS[trimmed] ?? trimmed
}
