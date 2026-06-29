import type { Booking, BookingStatus, PaymentMethod, PaymentStatus } from '../../types/booking'
import type { VehicleInspection } from '../../types/inspection'
import type { ServicePackage } from '../../types/servicePackage'
import type { BookingServiceStep, StepStatus, StepType } from '../../types/serviceStep'
import type { WashBay, WashBayStatus } from '../../types/washBay'
import type { WashHistory } from '../../types/washHistory'
import type { StaffCustomerSummary } from '../../utils/customerLookup'
import { normalizePhoneForDisplay } from '../auth/mapApiTypes'
import type {
  ApiBooking,
  ApiBookingServiceStep,
  ApiServicePackage,
  ApiStaffCustomer,
  ApiVehicleInspection,
  ApiWashBay,
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
    included_service_ids: normalizeIncludedServiceIds(pkg.included_service_ids),
    steps_template: [],
    is_active: pkg.is_active,
  }
}

/**
 * BE có thể trả `included_service_ids` dạng string[] hoặc object[] (DTO đã expand).
 * Chuẩn hóa về string[] để so sánh ID ổn định trong UI.
 */
function normalizeIncludedServiceIds(
  raw: ApiServicePackage['included_service_ids'],
): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((entry) => {
      if (entry == null) return null
      if (typeof entry === 'string') return entry
      if (typeof entry === 'object' && 'id' in entry && entry.id) {
        return String(entry.id)
      }
      return null
    })
    .filter((id): id is string => Boolean(id))
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

type WashHistoryBookingFallback = Pick<
  ApiBooking,
  'license_plate' | 'normalized_license_plate' | 'vehicle' | 'guest_name' | 'customer'
>

function resolveBookingLicensePlate(
  booking?: WashHistoryBookingFallback | null,
): string {
  if (!booking) return ''

  return (
    booking.license_plate ??
    booking.vehicle?.raw_license_plate ??
    booking.normalized_license_plate ??
    booking.vehicle?.normalized_license_plate ??
    ''
  )
}

export function resolveWashHistoryLicensePlate(
  item: ApiWashHistory,
  booking?: WashHistoryBookingFallback | null,
): string {
  return (
    item.vehicle?.raw_license_plate ??
    item.vehicle?.license_plate ??
    item.vehicle?.normalized_license_plate ??
    item.license_plate ??
    resolveBookingLicensePlate(booking)
  )
}

export function resolveWashHistoryCustomerName(
  item: ApiWashHistory,
  booking?: WashHistoryBookingFallback | null,
): string {
  return (
    item.customer?.full_name ??
    item.customer_name ??
    booking?.customer?.full_name ??
    booking?.guest_name ??
    'Khách'
  )
}

export function mapApiWashHistory(
  item: ApiWashHistory,
  booking?: WashHistoryBookingFallback | null,
): WashHistory {
  return {
    id: item.id,
    booking_id: item.booking_id,
    garage_id: item.garage_id,
    license_plate: resolveWashHistoryLicensePlate(item, booking),
    service_package_id: item.service_package_id,
    service_package_name: item.service_package?.name ?? item.service_package_name,
    customer_name: resolveWashHistoryCustomerName(item, booking),
    final_price: item.amount_paid ?? item.final_price ?? 0,
    payment_method: item.payment_method,
    washed_at:
      item.paid_at ??
      item.service_completed_at ??
      item.washed_at ??
      '',
    earned_points: item.points_earned ?? item.earned_points ?? 0,
  }
}

function resolveStaffCustomerVehiclePlate(
  vehicle: ApiStaffCustomer['vehicles'][number],
): string {
  return (
    vehicle.raw_license_plate ??
    vehicle.license_plate ??
    vehicle.normalized_license_plate ??
    ''
  )
}

export function mapApiWashBay(bay: ApiWashBay, garageId?: string): WashBay {
  return {
    id: bay.id,
    garage_id: bay.garage_id ?? garageId ?? '',
    name: bay.name,
    bay_code: bay.bay_code,
    vehicle_type: bay.vehicle_type,
    status: bay.status as WashBayStatus,
    current_booking_id: bay.current_booking_id ?? null,
    is_active: bay.is_active,
  }
}

export function mapApiStaffCustomer(
  customer: ApiStaffCustomer,
): StaffCustomerSummary {
  return {
    user: {
      id: customer.customer_id,
      full_name: customer.full_name,
      email: customer.email ?? null,
      phone: customer.phone ? normalizePhoneForDisplay(customer.phone) : '',
      role: 'CUSTOMER',
      avatar_url: null,
      is_active: true,
    },
    garageBookingCount: customer.total_bookings_at_garage ?? 0,
    lastVisitAt: customer.last_booking_at ?? null,
    vehicles: customer.vehicles.map((vehicle) => {
      const plate = resolveStaffCustomerVehiclePlate(vehicle)
      return {
        id: vehicle.id,
        customer_id: customer.customer_id,
        raw_license_plate: plate,
        normalized_license_plate:
          vehicle.normalized_license_plate ?? plate,
        vehicle_type: vehicle.vehicle_type,
        engine_type: 'GASOLINE',
        motorbike_cc_group: null,
        car_body_type: null,
        seat_count: null,
        brand: vehicle.brand ?? null,
        model: vehicle.model ?? null,
        color: vehicle.color ?? null,
        is_default: false,
        is_active: true,
      }
    }),
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
