import type { Booking } from '../types/booking'
import { getBookingCustomerName, getBookingPhone } from './booking'

export function getAdminBookingCustomerName(booking: Booking) {
  return getBookingCustomerName(booking)
}

export function getAdminBookingPhone(booking: Booking) {
  return getBookingPhone(booking)
}
