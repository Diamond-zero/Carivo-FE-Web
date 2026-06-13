import type { LoyaltyTier } from './loyalty'

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT'

export interface Promotion {
  id: string
  code: string
  name: string
  description: string
  discount_type: DiscountType
  discount_value: number
  max_discount_amount: number | null
  min_order_amount: number
  applicable_tiers: LoyaltyTier[]
  usage_limit: number | null
  used_count: number
  start_at: string
  end_at: string
  is_active: boolean
}
