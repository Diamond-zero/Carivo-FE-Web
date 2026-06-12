import { getAdminUserById } from '../mocks/admin'
import type { Booking } from '../types/booking'

export function getAdminBookingCustomerName(booking: Booking) {
  if (booking.is_walk_in && booking.guest_name) {
    return booking.guest_name
  }

  if (booking.customer_id) {
    return getAdminUserById(booking.customer_id)?.full_name ?? 'Khách hàng'
  }

  return 'Khách hàng'
}

export function getAdminBookingPhone(booking: Booking) {
  if (booking.guest_phone) {
    return booking.guest_phone
  }

  if (booking.customer_id) {
    return getAdminUserById(booking.customer_id)?.phone ?? ''
  }

  return ''
}
