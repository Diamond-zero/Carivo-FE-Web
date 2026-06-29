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
