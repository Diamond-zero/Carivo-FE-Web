import type { Booking } from '../types/booking'
import { mockUsers } from '../mocks/users'

export function getBookingCustomerName(booking: Booking) {
  if (booking.is_walk_in && booking.guest_name) {
    return booking.guest_name
  }

  if (booking.customer_id) {
    const customer = mockUsers.find((user) => user.id === booking.customer_id)
    return customer?.full_name ?? 'Khách hàng'
  }

  return 'Khách hàng'
}

export function getBookingPhone(booking: Booking) {
  if (booking.guest_phone) {
    return booking.guest_phone
  }

  if (booking.customer_id) {
    const customer = mockUsers.find((user) => user.id === booking.customer_id)
    return customer?.phone ?? ''
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
