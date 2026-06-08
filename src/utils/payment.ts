import type { Booking } from '../types/booking'
import { getMarkPaidGuard } from './bookingActionGuards'
import type { WashHistory } from '../types/washHistory'
import { getBookingCustomerName } from './booking'

export function calculateEarnedPoints(booking: Booking): number {
  if (!booking.customer_id) return 0
  return Math.floor(booking.final_price / 10000)
}

export function buildWashHistory(booking: Booking): WashHistory {
  const washedAt = new Date().toISOString().slice(0, 19)

  return {
    id: `wash-history-${Date.now()}`,
    booking_id: booking.id,
    garage_id: booking.garage_id,
    license_plate: booking.license_plate,
    service_package_id: booking.service_package_id,
    customer_name: getBookingCustomerName(booking),
    final_price: booking.final_price,
    payment_method: 'CASH',
    washed_at: washedAt,
    earned_points: calculateEarnedPoints(booking),
  }
}

export function canMarkBookingPaid(
  booking: Booking,
  staffGarageId?: string,
): boolean {
  return getMarkPaidGuard(booking, staffGarageId).allowed
}
