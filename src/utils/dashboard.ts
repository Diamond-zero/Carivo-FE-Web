import type { Booking } from '../types/booking'
import { getTodayDateString } from './format'

export interface DashboardStats {
  todayBookings: number
  waitingCheckIn: number
  inProgress: number
  completedUnpaid: number
}

function isTodayBooking(booking: Booking, today: string) {
  return booking.booking_date === today
}

export function getDashboardStats(bookings: Booking[]): DashboardStats {
  const today = getTodayDateString()
  const todayBookings = bookings.filter((booking) =>
    isTodayBooking(booking, today),
  )

  return {
    todayBookings: todayBookings.length,
    waitingCheckIn: todayBookings.filter(
      (booking) => booking.status === 'CONFIRMED',
    ).length,
    inProgress: todayBookings.filter(
      (booking) => booking.status === 'IN_PROGRESS',
    ).length,
    completedUnpaid: todayBookings.filter(
      (booking) =>
        booking.status === 'COMPLETED' && booking.payment_status === 'UNPAID',
    ).length,
  }
}

export function getUpcomingBookings(bookings: Booking[], limit = 5) {
  const today = getTodayDateString()
  const activeStatuses = new Set<Booking['status']>([
    'CONFIRMED',
    'CHECKED_IN',
    'IN_PROGRESS',
  ])

  return [...bookings]
    .filter(
      (booking) =>
        isTodayBooking(booking, today) && activeStatuses.has(booking.status),
    )
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    )
    .slice(0, limit)
}
