import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  activateAdminTierRuleApi,
  deactivateAdminTierRuleApi,
  getAdminTierRulesApi,
  updateAdminTierRuleApi,
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

export function useUpdateAdminTierRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      ruleId,
      values,
    }: {
      ruleId: string
      values: AdminTierRuleFormValues
    }) => mapApiTierRule(await updateAdminTierRuleApi(ruleId, toTierRuleUpdatePayload(values))),
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
