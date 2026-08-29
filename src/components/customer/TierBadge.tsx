import { getTierColor, getTierLabel } from '../../constants/loyaltyTier'
import type { LoyaltyTierName } from '../../types/loyalty'
import { cn } from '../../lib/utils'

interface TierBadgeProps {
  tier: LoyaltyTierName
  className?: string
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
        getTierColor(tier),
        className,
      )}
    >
      {getTierLabel(tier)}
    </span>
  )
}
