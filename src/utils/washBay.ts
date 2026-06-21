import type { Booking } from '../types/booking'
import type { WashBay } from '../types/washBay'

export function bookingRequiresWashBay(booking: Booking): boolean {
  if (booking.requires_wash_bay != null) {
    return booking.requires_wash_bay
  }

  const rawRequires = booking.raw?.requires_wash_bay
  if (rawRequires != null) {
    return rawRequires
  }

  if (booking.raw?.service_package?.requires_wash_bay != null) {
    return booking.raw.service_package.requires_wash_bay
  }

  if (booking.raw?.booking_items?.length) {
    return booking.raw.booking_items.some((item) => item.requires_wash_bay)
  }

  return false
}

export function canAssignWashBay(
  booking: Booking,
  staffGarageId?: string,
): boolean {
  if (staffGarageId && booking.garage_id !== staffGarageId) {
    return false
  }

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
