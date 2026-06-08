import type { LoyaltyTier, TierRule } from '../types/loyalty'

export const LOYALTY_TIER_LABELS: Record<LoyaltyTier, string> = {
  BRONZE: 'Đồng',
  SILVER: 'Bạc',
  GOLD: 'Vàng',
  PLATINUM: 'Bạch kim',
}

export const LOYALTY_TIER_COLORS: Record<LoyaltyTier, string> = {
  BRONZE: 'bg-[#CD7F32]/15 text-[#8B5A2B] border-[#CD7F32]/30',
  SILVER: 'bg-[#C0C0C0]/20 text-slate-700 border-[#C0C0C0]/40',
  GOLD: 'bg-[#FFD700]/20 text-[#9A7B00] border-[#FFD700]/40',
  PLATINUM: 'bg-[#E5E4E2]/40 text-slate-800 border-[#C0BFC0]/50',
}

export const LOYALTY_TIER_CARD_BG: Record<LoyaltyTier, string> = {
  BRONZE: 'from-[#CD7F32]/10 to-orange-50',
  SILVER: 'from-slate-100 to-slate-50',
  GOLD: 'from-[#FFD700]/15 to-amber-50',
  PLATINUM: 'from-[#E5E4E2]/30 to-slate-100',
}

export const mockTierRules: TierRule[] = [
  {
    tier: 'BRONZE',
    booking_window_days: 7,
    max_upcoming_bookings: 1,
    points_multiplier: 1.1,
    priority_level: 1,
  },
  {
    tier: 'SILVER',
    booking_window_days: 10,
    max_upcoming_bookings: 1,
    points_multiplier: 1.2,
    priority_level: 2,
  },
  {
    tier: 'GOLD',
    booking_window_days: 12,
    max_upcoming_bookings: 2,
    points_multiplier: 1.35,
    priority_level: 3,
  },
  {
    tier: 'PLATINUM',
    booking_window_days: 14,
    max_upcoming_bookings: 3,
    points_multiplier: 1.5,
    priority_level: 4,
  },
]

export function getTierRule(tier: LoyaltyTier) {
  return mockTierRules.find((rule) => rule.tier === tier)
}

export function getNextTier(tier: LoyaltyTier): LoyaltyTier | null {
  const order: LoyaltyTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']
  const index = order.indexOf(tier)
  return index < order.length - 1 ? order[index + 1] : null
}
