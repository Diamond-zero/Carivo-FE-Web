import type { Booking } from '../types/booking'
import type { WashBay } from '../types/washBay'

export function bookingRequiresWashBay(_booking: Booking): boolean {
  return true
}

export function canAssignWashBay(booking: Booking): boolean {
  return (
    booking.status === 'IN_PROGRESS' &&
    !booking.wash_bay_id &&
    bookingRequiresWashBay(booking)
  )
}

export function getSelectableWashBays(
  washBays: WashBay[],
  booking: Booking,
): WashBay[] {
  return washBays.filter(
    (bay) =>
      bay.garage_id === booking.garage_id &&
      bay.is_active &&
      bay.status === 'AVAILABLE' &&
      bay.vehicle_type === booking.vehicle_type,
  )
}
