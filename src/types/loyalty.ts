export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

export interface CustomerLoyalty {
  customer_id: string
  current_tier: LoyaltyTier
  total_points: number
  available_points: number
  redeemed_points: number
  expired_points: number
  total_spent: number
  total_visits: number
  expiring_points: Array<{ points: number; expires_at: string }>
}

export interface TierRule {
  tier: LoyaltyTier
  booking_window_days: number
  max_upcoming_bookings: number
  points_multiplier: number
  priority_level: number
}

export interface TierUpgradeRecord {
  id: string
  customer_id: string
  from_tier: LoyaltyTier | null
  to_tier: LoyaltyTier
  upgraded_at: string
  reason: string
}

export interface LoyaltyPointRecord {
  id: string
  customer_id: string
  points: number
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED'
  description: string
  related_booking_id: string | null
  created_at: string
}
