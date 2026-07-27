/**
 * Mapper functions để convert workspace API response sang Booking type
 */

import type { Booking } from '../../types/booking'
import type { AvailableAction, ApiWorkspaceBooking } from '../../types/api/workspace'
import { normalizeServicePackageName } from '../../utils/servicePackageLabels'

/**
 * Convert workspace booking sang Booking type cho list display
 */
export function mapWorkspaceBookingToBooking(
  workspaceBooking: ApiWorkspaceBooking,
): Booking {
  return {
    id: workspaceBooking.booking_id,
    garage_id: workspaceBooking.garage_id,
    customer_id: '',
    customer_name: workspaceBooking.customer_name || '',
    customer_phone: workspaceBooking.customer_phone || '',
    is_walk_in: workspaceBooking.is_walk_in ?? false,
    guest_name: null,
    guest_phone: null,
    guest_email: null,
    license_plate: workspaceBooking.license_plate || '',
    vehicle_type:
      workspaceBooking.vehicle_type === 'OTHER' ? 'CAR' : workspaceBooking.vehicle_type,
    vehicle_id: '',
    booking_date: workspaceBooking.start_time.split('T')[0],
    start_time: workspaceBooking.start_time,
    end_time: workspaceBooking.end_time,
    original_price: workspaceBooking.final_price ?? 0,
    discount_amount: 0,
    final_price: workspaceBooking.final_price ?? 0,
    payment_method: 'CASH' as const,
    payment_status: workspaceBooking.payment_status,
    status: workspaceBooking.booking_status,
    note: null,
    wash_bay_id: workspaceBooking.wash_bay_id,
    assigned_inspection_staff_id: workspaceBooking.assigned_inspection_staff_id,
    service_package_id: '',
    service_package_name: normalizeServicePackageName(workspaceBooking.service_package_name),
    earned_points: workspaceBooking.earned_points,
    assigned_care_staff_ids: [],
    requires_care_staff: false,
    care_staff_required_count: 0,
    raw: ({
      workflow_phase: workspaceBooking.workflow_phase,
      current_service_item_key: workspaceBooking.current_service_item_key,
      blocked_by_incident: workspaceBooking.blocked_by_incident,
      arrival_status: workspaceBooking.arrival_status,
      vehicle_brand: workspaceBooking.vehicle_brand,
      vehicle_color: workspaceBooking.vehicle_color,
      available_actions: workspaceBooking.available_actions,
    } as unknown) as Booking['raw'],
  }
}

/**
 * Convert mảng workspace bookings sang mảng Bookings
 */
export function mapWorkspaceBookings(bookings: ApiWorkspaceBooking[]): Booking[] {
  return bookings.map(mapWorkspaceBookingToBooking)
}

/**
 * Helper: lấy available_actions từ mapped Booking (luôn nằm trong raw.available_actions).
 * Trả mảng rỗng nếu không có — an toàn cho guard.
 */
export function getAvailableActions(booking: Booking): AvailableAction[] {
  return (booking.raw?.available_actions as AvailableAction[] | undefined) ?? []
}

/**
 * Helper: kiểm tra 1 action có nằm trong available_actions của booking hay không.
 */
export function hasAvailableAction(booking: Booking, action: AvailableAction): boolean {
  return getAvailableActions(booking).includes(action)
}
