import type { WalkInBookingForm } from '../types/booking'
import { getServicePackageById } from '../mocks/servicePackages'

export function addMinutesToIso(iso: string, minutes: number) {
  const date = new Date(iso)
  date.setMinutes(date.getMinutes() + minutes)
  return date.toISOString().slice(0, 19)
}

export function toBookingDate(iso: string) {
  return iso.slice(0, 10)
}

export function buildWalkInBooking(
  garageId: string,
  data: WalkInBookingForm,
): import('../types/booking').Booking {
  const servicePackage = getServicePackageById(data.service_package_id)
  const duration = servicePackage?.duration_minutes ?? 30
  const price = servicePackage?.base_price ?? 0
  const id = `booking-walk-${Date.now()}`

  return {
    id,
    customer_id: null,
    vehicle_id: null,
    is_walk_in: true,
    guest_name: data.guest_name,
    guest_phone: data.guest_phone,
    guest_email: data.guest_email?.trim() || null,
    garage_id: garageId,
    wash_bay_id: null,
    service_package_id: data.service_package_id,
    license_plate: data.license_plate,
    vehicle_type: data.vehicle_type,
    booking_date: toBookingDate(data.start_time),
    start_time: data.start_time,
    end_time: addMinutesToIso(data.start_time, duration),
    original_price: price,
    discount_amount: 0,
    final_price: price,
    payment_method: 'CASH',
    payment_status: 'UNPAID',
    status: 'CHECKED_IN',
    note: data.note?.trim() || null,
  }
}

export type WalkInTimeSlotOption = 'now' | 'plus30' | 'plus60' | 'custom'

export function getWalkInStartTime(
  option: WalkInTimeSlotOption,
  customValue?: string,
): string {
  if (option === 'custom' && customValue) {
    return customValue.length === 16 ? `${customValue}:00` : customValue
  }

  const base = new Date()
  base.setSeconds(0, 0)

  if (option === 'plus30') {
    base.setMinutes(base.getMinutes() + 30)
  } else if (option === 'plus60') {
    base.setMinutes(base.getMinutes() + 60)
  }

  return base.toISOString().slice(0, 19)
}
