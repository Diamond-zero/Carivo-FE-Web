import { mockBookings } from './bookings'
import { MOCK_GARAGE_ID } from './garage'
import type { WashHistory } from '../types/washHistory'
import { calculateEarnedPoints } from '../utils/payment'
import { getBookingCustomerName } from '../utils/booking'

export const mockWashHistories: WashHistory[] = [
  {
    id: 'wash-history-001',
    booking_id: 'booking-007',
    garage_id: MOCK_GARAGE_ID,
    license_plate: '30A-555.44',
    service_package_id: 'pkg-wash-car-premium',
    customer_name: getBookingCustomerName(
      mockBookings.find((b) => b.id === 'booking-007')!,
    ),
    final_price: 252000,
    payment_method: 'CASH',
    washed_at: '2026-06-07T16:05:00',
    earned_points: calculateEarnedPoints(
      mockBookings.find((b) => b.id === 'booking-007')!,
    ),
  },
  {
    id: 'wash-history-002',
    booking_id: 'booking-008',
    garage_id: MOCK_GARAGE_ID,
    license_plate: '29X1-333.44',
    service_package_id: 'pkg-wash-bike-basic',
    customer_name: getBookingCustomerName(
      mockBookings.find((b) => b.id === 'booking-008')!,
    ),
    final_price: 50000,
    payment_method: 'CASH',
    washed_at: '2026-06-07T16:55:00',
    earned_points: calculateEarnedPoints(
      mockBookings.find((b) => b.id === 'booking-008')!,
    ),
  },
]
