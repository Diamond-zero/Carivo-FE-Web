import type { LoyaltyTier } from './loyalty'
import type { VehicleType } from './washBay'

export type { LoyaltyTier } from './loyalty'

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT'
export type PromotionAudience = 'ALL' | 'CUSTOMER' | 'WALK_IN'

export interface Promotion {
  id: string
  code: string
  name: string
  description: string
  discount_type: DiscountType
  discount_value: number
  max_discount_amount: number | null
  min_order_amount: number
  audience: PromotionAudience
  phone_required: boolean
  per_phone_limit: number | null
  applicable_tiers: LoyaltyTier[]
  applicable_vehicle_types: VehicleType[]
  applicable_service_package_ids: string[]
  start_at: string
  end_at: string
  usage_limit: number | null
  per_customer_limit: number | null
  used_count: number
  reserved_count: number
  is_active: boolean
  created_by_id?: string | null
  updated_by_id?: string | null
  created_at?: string
  updated_at?: string
}
