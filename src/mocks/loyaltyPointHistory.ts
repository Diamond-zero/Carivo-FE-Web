import type { LoyaltyPointRecord } from '../types/loyalty'

export const mockLoyaltyPointHistory: LoyaltyPointRecord[] = [
  {
    id: 'point-001',
    customer_id: 'user-cus-001',
    points: 25,
    type: 'EARNED',
    description: 'Tích điểm từ booking #007',
    related_booking_id: 'booking-007',
    created_at: '2026-06-07T16:05:00',
  },
  {
    id: 'point-002',
    customer_id: 'user-cus-001',
    points: 5,
    type: 'EARNED',
    description: 'Tích điểm từ booking #008',
    related_booking_id: 'booking-008',
    created_at: '2026-06-07T16:55:00',
  },
  {
    id: 'point-003',
    customer_id: 'user-cus-001',
    points: 100,
    type: 'REDEEMED',
    description: 'Đổi điểm giảm giá booking',
    related_booking_id: 'booking-006',
    created_at: '2026-05-20T11:00:00',
  },
  {
    id: 'point-004',
    customer_id: 'user-cus-002',
    points: 15,
    type: 'EARNED',
    description: 'Tích điểm từ booking #001',
    related_booking_id: 'booking-001',
    created_at: '2026-06-08T09:00:00',
  },
  {
    id: 'point-005',
    customer_id: 'user-cus-004',
    points: 28,
    type: 'EARNED',
    description: 'Tích điểm từ booking tại garage',
    related_booking_id: null,
    created_at: '2026-06-05T15:30:00',
  },
]
