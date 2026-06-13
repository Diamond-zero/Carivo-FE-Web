import type { Booking, BookingStatus } from '../../types/booking'
import { mockAdminBookings } from './bookings'

function cloneBookings(items: Booking[]): Booking[] {
  return items.map((booking) => ({ ...booking }))
}

let bookings = cloneBookings(mockAdminBookings)

export function getAdminBookingsFromStore(): Booking[] {
  return cloneBookings(bookings)
}

export function getAdminBookingById(bookingId: string) {
  const booking = bookings.find((item) => item.id === bookingId)
  return booking ? { ...booking } : undefined
}

export function getAdminBookingsByGarage(garageId: string) {
  return getAdminBookingsFromStore().filter((booking) => booking.garage_id === garageId)
}

const terminalStatuses: BookingStatus[] = ['COMPLETED', 'CANCELED', 'NO_SHOW']

export function updateAdminBookingStatus(bookingId: string, status: BookingStatus) {
  const index = bookings.findIndex((item) => item.id === bookingId)
  if (index === -1) {
    return { ok: false as const, message: 'Không tìm thấy booking.' }
  }

  const current = bookings[index]
  if (current.status === status) {
    return { ok: false as const, message: 'Booking đã ở trạng thái này.' }
  }

  if (current.payment_status === 'PAID' && status !== 'COMPLETED') {
    return {
      ok: false as const,
      message: 'Booking đã thanh toán — không thể đổi sang trạng thái khác COMPLETED.',
    }
  }

  const updated: Booking = {
    ...current,
    status,
    wash_bay_id:
      status === 'CANCELED' || status === 'NO_SHOW' || status === 'COMPLETED'
        ? null
        : current.wash_bay_id,
  }

  bookings = [...bookings.slice(0, index), updated, ...bookings.slice(index + 1)]
  return { ok: true as const, booking: updated }
}

export function markAdminBookingPaid(bookingId: string) {
  const index = bookings.findIndex((item) => item.id === bookingId)
  if (index === -1) {
    return { ok: false as const, message: 'Không tìm thấy booking.' }
  }

  const current = bookings[index]
  if (current.payment_status === 'PAID') {
    return { ok: false as const, message: 'Booking đã được đánh dấu thanh toán.' }
  }

  if (current.status !== 'COMPLETED') {
    return {
      ok: false as const,
      message: 'Chỉ booking COMPLETED mới được đánh dấu đã thanh toán.',
    }
  }

  const updated: Booking = {
    ...current,
    payment_status: 'PAID',
  }

  bookings = [...bookings.slice(0, index), updated, ...bookings.slice(index + 1)]
  return { ok: true as const, booking: updated }
}

export function cancelAdminBooking(bookingId: string) {
  const index = bookings.findIndex((item) => item.id === bookingId)
  if (index === -1) {
    return { ok: false as const, message: 'Không tìm thấy booking.' }
  }

  const current = bookings[index]
  if (terminalStatuses.includes(current.status)) {
    return {
      ok: false as const,
      message: 'Booking đã kết thúc — không thể hủy.',
    }
  }

  const updated: Booking = {
    ...current,
    status: 'CANCELED',
    wash_bay_id: null,
  }

  bookings = [...bookings.slice(0, index), updated, ...bookings.slice(index + 1)]
  return { ok: true as const, booking: updated }
}
