import {
  LOYALTY_TIER_COLORS,
  LOYALTY_TIER_LABELS,
} from '../../constants/loyaltyTier'
import type { LoyaltyTier } from '../../types/loyalty'
import { cn } from '../../lib/utils'

interface TierBadgeProps {
  tier: LoyaltyTier
  className?: string
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
        LOYALTY_TIER_COLORS[tier],
        className,
      )}
    >
      {LOYALTY_TIER_LABELS[tier]}
    </span>
  )
}
