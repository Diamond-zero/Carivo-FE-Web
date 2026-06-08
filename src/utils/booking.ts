import type { Booking } from '../types/booking'
import { mockServiceSteps } from '../mocks/serviceSteps'
import { mockUsers } from '../mocks/users'

export function getServiceStepsByBookingId(bookingId: string) {
  return mockServiceSteps
    .filter((step) => step.booking_id === bookingId)
    .sort((a, b) => a.order - b.order)
}

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

export function getBookingAction(booking: Booking): BookingAction | null {
  if (booking.status === 'CONFIRMED') {
    return {
      label: 'Check-in',
      to: `/bookings/check-in?bookingId=${booking.id}`,
    }
  }

  if (booking.status === 'CHECKED_IN') {
    return {
      label: 'Bắt đầu DV',
      to: `/service/execution?bookingId=${booking.id}`,
    }
  }

  if (booking.status === 'IN_PROGRESS') {
    return {
      label: 'Tiếp tục',
      to: `/service/execution?bookingId=${booking.id}`,
    }
  }

  if (booking.status === 'COMPLETED' && booking.payment_status === 'UNPAID') {
    return {
      label: 'Thanh toán',
      to: `/bookings/${booking.id}`,
    }
  }

  return null
}
