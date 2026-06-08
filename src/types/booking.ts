import type { VehicleType } from './washBay'

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'NO_SHOW'

export type PaymentStatus = 'UNPAID' | 'PAID'
export type PaymentMethod = 'CASH'

export interface Booking {
  id: string
  customer_id: string | null
  vehicle_id: string | null
  is_walk_in: boolean
  guest_name: string | null
  guest_phone: string | null
  guest_email: string | null
  garage_id: string
  wash_bay_id: string | null
  service_package_id: string
  license_plate: string
  vehicle_type: VehicleType
  booking_date: string
  start_time: string
  end_time: string
  original_price: number
  discount_amount: number
  final_price: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  status: BookingStatus
  note: string | null
}

export interface WalkInBookingForm {
  guest_name: string
  guest_phone: string
  guest_email?: string
  license_plate: string
  vehicle_type: VehicleType
  service_package_id: string
  start_time: string
  note?: string
}
