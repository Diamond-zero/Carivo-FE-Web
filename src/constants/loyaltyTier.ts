import type { LoyaltyTierName } from '../types/loyalty'

const DEFAULT_TIER_COLOR = 'bg-slate-100 text-slate-700 border-slate-200'
const DEFAULT_TIER_CARD_BG = 'from-slate-100 to-slate-50'

/** Legacy lookup maps remain empty; tier definitions come from the API. */
export const LOYALTY_TIER_LABELS: Record<string, string> = {}
export const LOYALTY_TIER_COLORS: Record<string, string> = {}
export const LOYALTY_TIER_CARD_BG: Record<string, string> = {}

export function getTierLabel(tier: LoyaltyTierName): string {
  return LOYALTY_TIER_LABELS[tier] ?? tier
}

export function getTierColor(tier: LoyaltyTierName): string {
  return LOYALTY_TIER_COLORS[tier] ?? DEFAULT_TIER_COLOR
}

export function getTierCardBackground(tier: LoyaltyTierName): string {
  return LOYALTY_TIER_CARD_BG[tier] ?? DEFAULT_TIER_CARD_BG
}

export function getNextTier<T extends { tier_name: string; priority_level: number }>(
  tiers: T[],
  currentTier: string,
): T | null {
  return (
    [...tiers]
      .filter((tier) => tier.priority_level > (tiers.find((item) => item.tier_name === currentTier)?.priority_level ?? -Infinity))
      .sort((a, b) => a.priority_level - b.priority_level)[0] ?? null
  )
}
