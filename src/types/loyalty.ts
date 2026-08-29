export type LoyaltyTierName = string
export type LoyaltyTier = LoyaltyTierName

/** Loyalty tier configuration returned by the backend. */
export interface LoyaltyTierConfig {
  tier_name: LoyaltyTierName
  priority_level: number
  min_total_points: number
  point_multiplier: number
  is_active: boolean
  id?: string
  booking_window_days?: number
  max_upcoming_bookings?: number
  min_total_spent?: number
  min_total_visits?: number
  created_at?: string
  updated_at?: string
}

export interface CustomerLoyalty {
  customer_id: string
  current_tier: LoyaltyTierName
  total_points: number
  available_points: number
  redeemed_points: number
  expired_points: number
  total_spent: number
  total_visits: number
  expiring_points: Array<{ points: number; expires_at: string }>
}

export interface TierRule {
  tier: LoyaltyTierName
  booking_window_days: number
  max_upcoming_bookings: number
  points_multiplier: number
  priority_level: number
}

export interface TierUpgradeRecord {
  id: string
  customer_id: string
  from_tier: LoyaltyTierName | null
  to_tier: LoyaltyTierName
  upgraded_at: string
  reason: string
}

export interface LoyaltyPointRecord {
  id: string
  customer_id: string
  points: number
  type: 'EARN' | 'REDEEM' | 'REFUND' | 'EXPIRE' | 'ADJUST'
  description: string
  related_booking_id: string | null
  created_at: string
}
