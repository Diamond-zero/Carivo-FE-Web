import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  activateAdminPromotionApi,
  createAdminPromotionApi,
  deactivateAdminPromotionApi,
  deleteAdminPromotionApi,
  getAdminPromotionByIdApi,
  getAdminPromotionsApi,
  updateAdminPromotionApi,
  type PromotionCreatePayload,
  type PromotionListParams,
  type PromotionUpdatePayload,
} from '../../../api/promotion.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapApiPromotion } from '../../../lib/mappers/adminMappers'
import type { Promotion, PromotionAudience } from '../../../types/promotion'
import { adminQueryKeys } from './queryKeys'

const DEFAULT_PAGE_SIZE = 20

export type AdminPromotionStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'

export interface AdminPromotionListFilters extends Partial<PromotionListParams> {
  statusFilter?: AdminPromotionStatusFilter
  query?: string
}

function toAdminPromotionParams(
  filters: AdminPromotionListFilters,
): PromotionListParams {
  const params: PromotionListParams = {
    page: filters.page ?? 1,
    limit: filters.limit ?? DEFAULT_PAGE_SIZE,
  }

  const trimmedSearch = filters.query?.trim()
  if (trimmedSearch) {
    params.search = trimmedSearch
  }

  if (filters.audience) {
    params.audience = filters.audience
  }

  if (filters.tier) {
    params.tier = filters.tier
  }

  if (filters.vehicle_type) {
    params.vehicle_type = filters.vehicle_type
  }

  if (filters.statusFilter === 'ACTIVE') {
    params.is_active = true
  } else if (filters.statusFilter === 'INACTIVE') {
    params.is_active = false
  } else if (typeof filters.is_active === 'boolean') {
    params.is_active = filters.is_active
  }

  if (typeof filters.valid_only === 'boolean') {
    params.valid_only = filters.valid_only
  }

  return params
}

function filterPromotionsClientSide(
  promotions: Promotion[],
  filters: AdminPromotionListFilters,
): Promotion[] {
  const normalizedQuery = (filters.query ?? '').trim().toLowerCase()
  const discountType = filters.discount_type

  return promotions.filter((promo) => {
    if (discountType && promo.discount_type !== discountType) {
      return false
    }

    if (
      filters.statusFilter === 'ACTIVE' &&
      !promo.is_active
    ) {
      return false
    }

    if (
      filters.statusFilter === 'INACTIVE' &&
      promo.is_active
    ) {
      return false
    }

    if (!normalizedQuery) return true

    return (
      promo.code.toLowerCase().includes(normalizedQuery) ||
      promo.name.toLowerCase().includes(normalizedQuery)
    )
  })
}

export function useAdminPromotions(filters: AdminPromotionListFilters = {}) {
  const { isAuthenticated } = useAdminAuth()
  const apiParams = toAdminPromotionParams(filters)

  const query = useQuery({
    queryKey: [...adminQueryKeys.promotionsList(), { params: apiParams }],
    queryFn: async () => {
      const result = await getAdminPromotionsApi(apiParams)
      return {
        promotions: result.promotions.map(mapApiPromotion),
        meta: result.meta,
      }
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const allPromotions = query.data?.promotions ?? []
  const promotions = filterPromotionsClientSide(allPromotions, filters)

  return {
    promotions,
    allPromotions,
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useAdminPromotion(promotionId?: string) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.promotion(promotionId ?? ''),
    queryFn: async () =>
      mapApiPromotion(await getAdminPromotionByIdApi(promotionId!)),
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
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.promotionsList() })
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
    }) =>
      mapApiPromotion(await updateAdminPromotionApi(promotionId, payload)),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.promotionsList() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.promotion(variables.promotionId),
      })
    },
  })
}

export function useDeleteAdminPromotion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (promotionId: string) => {
      await deleteAdminPromotionApi(promotionId)
      return promotionId
    },
    onSuccess: (promotionId) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.promotionsList() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.promotion(promotionId),
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
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.promotionsList() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.promotion(variables.promotionId),
      })
    },
  })
}

export const PROMOTION_AUDIENCES: PromotionAudience[] = [
  'ALL',
  'CUSTOMER',
  'WALK_IN',
]

export const PROMOTION_AUDIENCE_LABELS: Record<PromotionAudience, string> = {
  ALL: 'Tất cả',
  CUSTOMER: 'Khách đăng ký',
  WALK_IN: 'Khách vãng lai',
}

export { DEFAULT_PAGE_SIZE as ADMIN_PROMOTION_PAGE_SIZE }