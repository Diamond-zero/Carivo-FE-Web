import type { VehicleInspection } from '../types/inspection'
import { mockInProgressBookingId } from './bookings'

export const mockInspections: VehicleInspection[] = [
  {
    id: 'inspection-001',
    booking_id: mockInProgressBookingId,
    type: 'BEFORE_WASH',
    note: 'Xe có vết xước nhẹ ở yên xe, gương trái hơi rung.',
    images: [
      'https://placehold.co/600x400/e2e8f0/64748b?text=Before+Wash+1',
      'https://placehold.co/600x400/e2e8f0/64748b?text=Before+Wash+2',
    ],
    inspected_by: 'staff-profile-002',
    inspected_at: '2026-06-08T14:02:00',
  },
]
