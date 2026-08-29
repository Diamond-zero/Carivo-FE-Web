import { useQuery } from '@tanstack/react-query'
import { getLoyaltyTiersApi } from '../../api/loyalty.api'
import type { LoyaltyTierConfig } from '../../types/loyalty'

export const loyaltyTiersQueryKey = ['loyalty', 'tiers'] as const

export function useLoyaltyTiers() {
    return useQuery<LoyaltyTierConfig[], Error>({
        queryKey: loyaltyTiersQueryKey,
        queryFn: getLoyaltyTiersApi,
        staleTime: 60_000,
    })
}
