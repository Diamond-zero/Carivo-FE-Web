import type { Booking } from '../types/booking'

export function getBookingCustomerName(booking: Booking) {
  if (booking.customer_name) {
    return booking.customer_name
  }

  if (booking.is_walk_in && booking.guest_name) {
    return booking.guest_name
  }

  return 'Khách hàng'
}

export function getBookingPhone(booking: Booking) {
  if (booking.customer_phone) {
    return booking.customer_phone
  }

  if (booking.guest_phone) {
    return booking.guest_phone
  }

  return ''
}

export function normalizeSearchText(value: string) {
  return value.replace(/[\s.\-]/g, '').toLowerCase()
}

export interface BookingAction {
  label: string
  to: string
}

export {
  getBookingAction,
  getBookingListAction,
  type BookingListAction,
} from './bookingActionGuards'
