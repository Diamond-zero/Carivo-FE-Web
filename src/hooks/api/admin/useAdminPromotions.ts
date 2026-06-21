import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  activateAdminPromotionApi,
  createAdminPromotionApi,
  deactivateAdminPromotionApi,
  getAdminPromotionByIdApi,
  getAdminPromotionsApi,
  updateAdminPromotionApi,
  type PromotionCreatePayload,
  type PromotionUpdatePayload,
} from '../../../api/promotion.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapApiPromotion } from '../../../lib/mappers/adminMappers'
import type { DiscountType } from '../../../types/promotion'
import { normalizeSearchText } from '../../../utils/booking'
import { adminQueryKeys } from './queryKeys'

export interface AdminPromotionListFilters {
  query?: string
  discountTypeFilter?: DiscountType | 'ALL'
  statusFilter?: 'ALL' | 'ACTIVE' | 'INACTIVE'
}

function filterPromotions(
  promotions: ReturnType<typeof mapApiPromotion>[],
  filters: AdminPromotionListFilters,
) {
  const normalizedQuery = normalizeSearchText((filters.query ?? '').trim())

  return promotions.filter((promo) => {
    if (
      filters.discountTypeFilter &&
      filters.discountTypeFilter !== 'ALL' &&
      promo.discount_type !== filters.discountTypeFilter
    ) {
      return false
    }

    if (filters.statusFilter === 'ACTIVE' && !promo.is_active) {
      return false
    }

    if (filters.statusFilter === 'INACTIVE' && promo.is_active) {
      return false
    }

    if (!normalizedQuery) return true

    const code = normalizeSearchText(promo.code)
    const name = normalizeSearchText(promo.name)
    return code.includes(normalizedQuery) || name.includes(normalizedQuery)
  })
}

export function useAdminPromotions(filters: AdminPromotionListFilters = {}) {
  const { isAuthenticated } = useAdminAuth()

  const query = useQuery({
    queryKey: adminQueryKeys.promotions(),
    queryFn: async () => {
      const result = await getAdminPromotionsApi()
      return result.promotions
        .map(mapApiPromotion)
        .sort((a, b) => a.code.localeCompare(b.code))
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  const allPromotions = query.data ?? []
  const promotions = useMemo(
    () => filterPromotions(allPromotions, filters),
    [allPromotions, filters.query, filters.discountTypeFilter, filters.statusFilter],
  )

  return {
    promotions,
    allPromotions,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useAdminPromotion(promotionId?: string) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.promotion(promotionId ?? ''),
    queryFn: async () => mapApiPromotion(await getAdminPromotionByIdApi(promotionId!)),
    enabled: isAuthenticated && Boolean(promotionId),
    staleTime: 30_000,
  })
}

export function useCreateAdminPromotion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: PromotionCreatePayload) =>
      mapApiPromotion(await createAdminPromotionApi(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.promotions() })
    },
  })
}

export function useUpdateAdminPromotion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      promotionId,
      payload,
    }: {
      promotionId: string
      payload: PromotionUpdatePayload
    }) => mapApiPromotion(await updateAdminPromotionApi(promotionId, payload)),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.promotions() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.promotion(variables.promotionId),
      })
    },
  })
}

export function useToggleAdminPromotionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      promotionId,
      isActive,
    }: {
      promotionId: string
      isActive: boolean
    }) => {
      const promotion = isActive
        ? await activateAdminPromotionApi(promotionId)
        : await deactivateAdminPromotionApi(promotionId)
      return mapApiPromotion(promotion)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.promotions() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.promotion(variables.promotionId),
      })
    },
  })
}
