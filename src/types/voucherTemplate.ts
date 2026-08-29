import type { LoyaltyTier } from './loyalty'

export type { LoyaltyTier } from './loyalty'

export type VoucherType = 'FIXED_AMOUNT' | 'PERCENTAGE' | 'FREE_SERVICE'

export interface VoucherTemplate {
  id: string
  name: string
  description: string
  voucher_type: VoucherType
  value: number
  max_discount_amount: number | null
  min_order_amount: number
  service_package_id: string | null
  service_package_name: string | null
  points_cost: number
  voucher_validity_days: number
  total_quantity: number | null
  redeemed_count: number
  remaining_quantity: number | null
  per_customer_limit: number | null
  applicable_tiers: LoyaltyTier[]
  start_at: string
  end_at: string
  is_active: boolean
  created_by_id?: string | null
  updated_by_id?: string | null
  created_at?: string
  updated_at?: string
}
