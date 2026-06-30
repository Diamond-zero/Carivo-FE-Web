import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  activateAdminTierRuleApi,
  createAdminTierRuleApi,
  deactivateAdminTierRuleApi,
  deleteAdminTierRuleApi,
  expireAdminLoyaltyPointsApi,
  getAdminExpiringPointsApi,
  getAdminLoyaltyTransactionsListApi,
  getAdminTierRulesApi,
  updateAdminTierRuleApi,
  type ExpirePointsPayload,
  type ExpiringPointsParams,
  type LoyaltyTransactionsParams,
  type TierRuleCreatePayload,
  type TierRuleUpdatePayload,
} from '../../../api/loyalty.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapApiTierRule } from '../../../lib/mappers/adminMappers'
import type { AdminTierRuleFormValues } from '../../../lib/validations/adminTierRule'
import { adminQueryKeys } from './queryKeys'

function toTierRuleUpdatePayload(values: AdminTierRuleFormValues): TierRuleUpdatePayload {
  return {
    min_total_spent: values.min_total_spent,
    min_total_visits: values.min_total_visits,
    booking_window_days: values.booking_window_days,
    max_upcoming_bookings: values.max_upcoming_bookings,
    point_multiplier: values.points_multiplier,
    priority_level: values.priority_level,
    is_active: values.is_active,
  }
}

export function useAdminTierRules() {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.tierRules(),
    queryFn: async () => {
      const rules = await getAdminTierRulesApi()
      return rules.map(mapApiTierRule)
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useCreateAdminTierRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TierRuleCreatePayload) =>
      mapApiTierRule(await createAdminTierRuleApi(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.tierRules() })
    },
  })
}

export function useDeleteAdminTierRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ruleId: string) => {
      await deleteAdminTierRuleApi(ruleId)
      return ruleId
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.tierRules() })
    },
  })
}

export function useUpdateAdminTierRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      ruleId,
      values,
    }: {
      ruleId: string
      values: AdminTierRuleFormValues
    }) =>
      mapApiTierRule(
        await updateAdminTierRuleApi(ruleId, toTierRuleUpdatePayload(values)),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.tierRules() })
    },
  })
}

export function useToggleAdminTierRuleStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      ruleId,
      isActive,
    }: {
      ruleId: string
      isActive: boolean
    }) => {
      const rule = isActive
        ? await activateAdminTierRuleApi(ruleId)
        : await deactivateAdminTierRuleApi(ruleId)
      return mapApiTierRule(rule)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.tierRules() })
    },
  })
}

export function useAdminExpiringPoints(params?: ExpiringPointsParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.expiringPoints(params),
    queryFn: () => getAdminExpiringPointsApi(params),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useAdminLoyaltyTransactions(params?: LoyaltyTransactionsParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.loyaltyTransactions(params),
    queryFn: () => getAdminLoyaltyTransactionsListApi(params),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useExpireLoyaltyPoints() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload?: ExpirePointsPayload) => expireAdminLoyaltyPointsApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.expiringPoints() })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.loyaltyTransactions() })
    },
  })
}