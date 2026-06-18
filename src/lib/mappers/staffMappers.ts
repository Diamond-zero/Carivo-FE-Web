import type { Booking, BookingStatus, PaymentMethod, PaymentStatus } from '../../types/booking'
import type { VehicleInspection } from '../../types/inspection'
import type { ServicePackage } from '../../types/servicePackage'
import type { BookingServiceStep, StepStatus, StepType } from '../../types/serviceStep'
import type { WashBay, WashBayStatus } from '../../types/washBay'
import type { WashHistory } from '../../types/washHistory'
import { normalizePhoneForDisplay } from '../auth/mapApiTypes'
import type {
  ApiBooking,
  ApiBookingServiceStep,
  ApiServicePackage,
  ApiVehicleInspection,
  ApiWashHistory,
} from '../../types/api/staff'

function toDateOnly(value: string) {
  return value.includes('T') ? value.split('T')[0] : value
}

function toLocalDateTime(value: string) {
  if (!value.includes('T')) return value
  return value.slice(0, 19)
}

export function mapApiBooking(booking: ApiBooking): Booking {
  const licensePlate =
    booking.license_plate ??
    booking.vehicle?.raw_license_plate ??
    ''

  return {
    id: booking.id,
    customer_id: booking.customer_id,
    vehicle_id: booking.vehicle_id,
    is_walk_in: booking.is_walk_in,
    guest_name: booking.guest_name,
    guest_phone: booking.guest_phone
      ? normalizePhoneForDisplay(booking.guest_phone)
      : null,
    guest_email: booking.guest_email,
    garage_id: booking.garage_id,
    wash_bay_id: booking.wash_bay_id,
    service_package_id: booking.service_package_id,
    license_plate: licensePlate,
    vehicle_type: booking.vehicle_type,
    booking_date: toDateOnly(booking.booking_date),
    start_time: toLocalDateTime(booking.start_time),
    end_time: toLocalDateTime(booking.end_time),
    original_price: booking.original_price,
    discount_amount: booking.discount_amount,
    final_price: booking.final_price,
    payment_method: booking.payment_method as PaymentMethod,
    payment_status: booking.payment_status as PaymentStatus,
    status: booking.status as BookingStatus,
    note: booking.note,
    service_package_name: booking.service_package?.name,
    customer_name: booking.customer?.full_name ?? booking.guest_name,
    customer_phone: booking.customer?.phone
      ? normalizePhoneForDisplay(booking.customer.phone)
      : booking.guest_phone
        ? normalizePhoneForDisplay(booking.guest_phone)
        : null,
    requires_wash_bay: booking.requires_wash_bay ?? booking.service_package?.requires_wash_bay,
    earned_points: booking.earned_points,
    wash_bay_name: booking.wash_bay?.name,
    wash_bay_code: booking.wash_bay?.bay_code,
    wash_bay_status: booking.wash_bay?.status as Booking['wash_bay_status'],
    raw: booking,
  }
}

export function mapApiServicePackage(pkg: ApiServicePackage): ServicePackage {
  return {
    id: pkg.id,
    name: pkg.name,
    vehicle_type: pkg.vehicle_type,
    service_type: pkg.service_type as ServicePackage['service_type'],
    description: pkg.description ?? '',
    base_price: pkg.base_price,
    duration_minutes: pkg.duration_minutes,
    wash_bay_duration_minutes: pkg.wash_bay_duration_minutes ?? null,
    points_earned: pkg.points_earned,
    requires_wash_bay: pkg.requires_wash_bay,
    requires_care_staff: pkg.requires_care_staff ?? false,
    included_service_ids: pkg.included_service_ids ?? [],
    steps_template: [],
    is_active: pkg.is_active,
  }
}

export function mapApiServiceStep(step: ApiBookingServiceStep): BookingServiceStep {
  return {
    id: step.id,
    booking_id: step.booking_id,
    step_code: step.step_code,
    step_name: step.step_name,
    order: step.order,
    step_type: step.step_type as StepType,
    display_staff_type: step.display_staff_type as BookingServiceStep['display_staff_type'],
    assigned_staff_id: step.assigned_staff_id,
    confirmed_by_staff_id: step.confirmed_by_staff_id,
    status: step.status as StepStatus,
    instructions: step.instructions ?? [],
    started_at: step.started_at ? toLocalDateTime(step.started_at) : null,
    completed_at: step.completed_at ? toLocalDateTime(step.completed_at) : null,
  }
}

export function mapApiInspection(inspection: ApiVehicleInspection): VehicleInspection {
  return {
    id: inspection.id,
    booking_id: inspection.booking_id,
    type: inspection.type,
    note: inspection.note,
    images: inspection.images,
    inspected_by: inspection.inspected_by,
    inspected_at: inspection.inspected_at,
  }
}

export function mapApiWashHistory(item: ApiWashHistory): WashHistory {
  return {
    id: item.id,
    booking_id: item.booking_id,
    garage_id: item.garage_id,
    license_plate: item.license_plate,
    service_package_id: item.service_package_id,
    customer_name: item.customer_name,
    final_price: item.final_price,
    payment_method: item.payment_method === 'PAYOS' ? 'CASH' : 'CASH',
    washed_at: item.washed_at,
    earned_points: item.earned_points,
  }
}

export function deriveWashBaysFromBookings(
  bookings: ApiBooking[],
  garageId: string,
): WashBay[] {
  const bayMap = new Map<string, WashBay>()

  for (const booking of bookings) {
    if (!booking.wash_bay || booking.garage_id !== garageId) continue

    bayMap.set(booking.wash_bay.id, {
      id: booking.wash_bay.id,
      garage_id: garageId,
      name: booking.wash_bay.name,
      bay_code: booking.wash_bay.bay_code,
      vehicle_type: booking.wash_bay.vehicle_type,
      status: booking.wash_bay.status as WashBayStatus,
      current_booking_id: null,
      is_active: booking.wash_bay.is_active,
    })
  }

  for (const booking of bookings) {
    if (booking.status !== 'IN_PROGRESS' || !booking.wash_bay_id) continue
    const bay = bayMap.get(booking.wash_bay_id)
    if (bay) {
      bay.status = 'OCCUPIED'
      bay.current_booking_id = booking.id
    }
  }

  return Array.from(bayMap.values())
}

export function deriveWashHistoriesFromBookings(bookings: Booking[]): WashHistory[] {
  return bookings
    .filter(
      (booking) =>
        booking.status === 'COMPLETED' && booking.payment_status === 'PAID',
    )
    .map((booking) => ({
      id: `history-${booking.id}`,
      booking_id: booking.id,
      garage_id: booking.garage_id,
      license_plate: booking.license_plate,
      service_package_id: booking.service_package_id,
      customer_name: booking.customer_name ?? booking.guest_name ?? 'Khách',
      final_price: booking.final_price,
      payment_method: 'CASH' as const,
      washed_at: booking.start_time,
      earned_points: booking.earned_points ?? 0,
    }))
    .sort(
      (a, b) =>
        new Date(b.washed_at).getTime() - new Date(a.washed_at).getTime(),
    )
}
