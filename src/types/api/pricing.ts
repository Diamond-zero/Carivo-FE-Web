export type PricingVehicleType = 'CAR' | 'MOTORBIKE'
export type PricingEngineType = 'GASOLINE' | 'ELECTRIC'
export type PricingMotorbikeCcGroup = 'UNDER_175CC' | 'OVER_175CC'
export type PricingCarBodyType =
  | 'HATCHBACK'
  | 'SEDAN'
  | 'SUV'
  | 'MPV'
  | 'PICKUP'
  | 'VAN'

export interface VehiclePricingSnapshot {
  vehicle_type: PricingVehicleType
  engine_type: PricingEngineType | null
  motorbike_cc_group: PricingMotorbikeCcGroup | null
  car_body_type: PricingCarBodyType | null
  seat_count: number | null
}

export interface ServicePriceRule {
  id: string
  service_package_id: string
  garage_id: string | null
  vehicle_type: PricingVehicleType
  engine_type: PricingEngineType | null
  motorbike_cc_group: PricingMotorbikeCcGroup | null
  car_body_type: PricingCarBodyType | null
  seat_min: number | null
  seat_max: number | null
  price: number
  duration_minutes: number | null
  wash_bay_duration_minutes: number | null
  care_staff_duration_minutes: number | null
  effective_from: string
  effective_to: string | null
  version: number
  is_active: boolean
  note: string | null
  created_at: string
  updated_at: string
}

export interface ServicePriceRulePayload {
  service_package_id: string
  garage_id: string | null
  vehicle_type: PricingVehicleType
  engine_type: PricingEngineType | null
  motorbike_cc_group: PricingMotorbikeCcGroup | null
  car_body_type: PricingCarBodyType | null
  seat_min: number | null
  seat_max: number | null
  price: number
  duration_minutes: number | null
  wash_bay_duration_minutes: number | null
  care_staff_duration_minutes: number | null
  effective_from?: string
  effective_to: string | null
  is_active: boolean
  note: string | null
}

export interface VehiclePriceReview {
  booking_id: string
  previous_vehicle_snapshot: VehiclePricingSnapshot
  verified_vehicle_snapshot: VehiclePricingSnapshot
  classification_changed: boolean
  price_changed: boolean
  duration_changed: boolean
  requires_customer_confirmation: boolean
  capacity_available: boolean
  previous_original_price: number
  adjusted_original_price: number
  previous_final_price: number
  adjusted_final_price: number
  price_difference: number
  previous_duration_minutes: number
  adjusted_duration_minutes: number
}

export interface PriceQuote {
  id: string
  garage_id: string
  vehicle_id: string | null
  vehicle_snapshot: VehiclePricingSnapshot
  service_package_id: string
  add_on_service_ids: string[]
  items: Array<{
    service_package_id: string
    service_price_rule_id: string | null
    rule_version: number | null
    source: 'PRIMARY' | 'ADD_ON'
    name_snapshot: string
    price_snapshot: number
    duration_minutes: number
  }>
  subtotal: number
  total_duration_minutes: number
  effective_at: string
  expires_at: string
}
