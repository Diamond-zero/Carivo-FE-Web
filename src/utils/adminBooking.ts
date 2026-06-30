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
  if (raw.status === 'CANCELED') return raw.cancel_reason ?? null
  if (raw.status === 'NO_SHOW') return raw.no_show_reason ?? null
  if (raw.rescheduled_at) return raw.reschedule_reason ?? null
  if (raw.late_resolution_note) return raw.late_resolution_note
  return null
}
