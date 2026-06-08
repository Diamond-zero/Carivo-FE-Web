export type WashBayStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'INACTIVE'
export type VehicleType = 'MOTORBIKE' | 'CAR'

export interface WashBay {
  id: string
  garage_id: string
  name: string
  bay_code: string
  vehicle_type: VehicleType
  status: WashBayStatus
  current_booking_id: string | null
  is_active: boolean
}
