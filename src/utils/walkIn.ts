import type { WalkInBookingForm } from '../types/booking'
import type { WalkInBookingApiPayload } from '../types/api/staff'

function formatTimezoneOffset(date: Date): string {
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absoluteOffset = Math.abs(offsetMinutes)
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0')
  const minutes = String(absoluteOffset % 60).padStart(2, '0')
  return `${sign}${hours}:${minutes}`
}

/** ISO 8601 datetime with timezone offset for BE (e.g. 2026-06-17T09:03:00+07:00). */
export function toApiDateTimeString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${formatTimezoneOffset(date)}`
}

export function addMinutesToIso(iso: string, minutes: number) {
  const date = new Date(iso)
  date.setMinutes(date.getMinutes() + minutes)
  return toApiDateTimeString(date)
}

export function toBookingDate(iso: string) {
  return iso.slice(0, 10)
}

export type WalkInTimeSlotOption = 'now' | 'plus30' | 'plus60' | 'custom'

/** Garage slot grid — BE requires :00 / :30 alignment for scheduled walk-in. */
export const GARAGE_SLOT_INTERVAL_MINUTES = 30

type GarageResolvableSession =
  | {
      staffProfile: { garage_id: string }
      garage: { id: string }
    }
  | null
  | undefined

/** Garage ID from staff session — required by POST /admin/bookings/walk-in. */
export function getStaffGarageId(session: GarageResolvableSession): string | null {
  if (!session) return null
  return session.staffProfile.garage_id || session.garage.id || null
}

/** Round up to the next garage slot and ensure the result is in the future. */
export function alignToNextGarageSlot(
  date: Date,
  intervalMinutes = GARAGE_SLOT_INTERVAL_MINUTES,
): Date {
  const aligned = new Date(date)
  aligned.setSeconds(0, 0)
  aligned.setMilliseconds(0)

  const remainder = aligned.getMinutes() % intervalMinutes
  if (remainder !== 0) {
    aligned.setMinutes(aligned.getMinutes() + (intervalMinutes - remainder))
  }

  const now = new Date()
  now.setSeconds(0, 0)
  now.setMilliseconds(0)
  if (aligned.getTime() <= now.getTime()) {
    aligned.setMinutes(aligned.getMinutes() + intervalMinutes)
  }

  return aligned
}

export function getWalkInStartTime(
  option: WalkInTimeSlotOption,
  customValue?: string,
): string | null {
  if (option === 'now') {
    return null
  }

  if (option === 'custom' && customValue) {
    const normalized =
      customValue.length === 16 ? `${customValue}:00` : customValue
    return toApiDateTimeString(
      alignToNextGarageSlot(new Date(normalized)),
    )
  }

  const base = new Date()
  if (option === 'plus30') {
    base.setMinutes(base.getMinutes() + 30)
  } else if (option === 'plus60') {
    base.setMinutes(base.getMinutes() + 60)
  }

  return toApiDateTimeString(alignToNextGarageSlot(base))
}

export function buildWalkInBookingPayload(
  garageId: string,
  data: WalkInBookingForm,
): WalkInBookingApiPayload {
  const payload: WalkInBookingApiPayload = {
    garage_id: garageId,
    service_package_id: data.service_package_id,
    license_plate: data.license_plate.trim(),
    vehicle_type: data.vehicle_type,
    engine_type: data.engine_type,
    motorbike_cc_group: data.motorbike_cc_group,
    car_body_type: data.car_body_type,
    seat_count: data.seat_count,
    quote_id: data.quote_id,
    guest_name: data.guest_name.trim(),
    guest_phone: data.guest_phone.trim(),
    guest_email: data.guest_email?.trim() || '',
  }

  if (data.serve_now) {
    payload.serve_now = true
  } else if (data.start_time) {
    payload.start_time = data.start_time
  }

  if (data.suggestion_days) {
    payload.suggestion_days = data.suggestion_days
  }

  if (data.add_on_service_ids?.length) {
    payload.add_on_service_ids = data.add_on_service_ids
  }

  const promotionCode = data.promotion_code?.trim()
  if (promotionCode) {
    payload.promotion_code = promotionCode
  }

  const note = data.note?.trim()
  if (note) {
    payload.note = note
  }

  return payload
}
