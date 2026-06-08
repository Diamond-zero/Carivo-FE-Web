export type VehicleType = 'MOTORBIKE' | 'CAR'
export type EngineType = 'GASOLINE' | 'ELECTRIC'
export type MotorbikeCcGroup = 'UNDER_175CC' | 'OVER_175CC'
export type CarBodyType =
  | 'HATCHBACK'
  | 'SEDAN'
  | 'SUV'
  | 'MPV'
  | 'PICKUP'
  | 'VAN'

export interface Vehicle {
  id: string
  customer_id: string
  raw_license_plate: string
  normalized_license_plate: string
  vehicle_type: VehicleType
  engine_type: EngineType
  motorbike_cc_group: MotorbikeCcGroup | null
  car_body_type: CarBodyType | null
  seat_count: number | null
  brand: string | null
  model: string | null
  color: string | null
  is_default: boolean
  is_active: boolean
}
