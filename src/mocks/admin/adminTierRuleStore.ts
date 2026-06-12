import type { AdminTierRule } from '../../types/admin'
import type { LoyaltyTier } from '../../types/loyalty'
import { mockAdminTierRules } from './tierRules'

const tierOrder: LoyaltyTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']

function cloneRules(items: AdminTierRule[]): AdminTierRule[] {
  return items.map((rule) => ({ ...rule }))
}

let tierRules = cloneRules(mockAdminTierRules)

export function getAdminTierRulesFromStore(): AdminTierRule[] {
  return cloneRules(
    [...tierRules].sort(
      (a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier),
    ),
  )
}

export function getAdminTierRuleById(ruleId: string) {
  const rule = tierRules.find((item) => item.id === ruleId)
  return rule ? { ...rule } : undefined
}

export function getAdminTierRuleByTier(tier: LoyaltyTier) {
  const rule = tierRules.find((item) => item.tier === tier)
  return rule ? { ...rule } : undefined
}

export type AdminTierRuleInput = Omit<AdminTierRule, 'id' | 'tier'>

function validateTierThresholds(
  rules: AdminTierRule[],
  updated: AdminTierRule,
): string | null {
  const merged = rules.map((rule) => (rule.id === updated.id ? updated : rule))
  const sorted = [...merged].sort(
    (a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier),
  )

  for (let index = 1; index < sorted.length; index += 1) {
    const lower = sorted[index - 1]
    const higher = sorted[index]

    if (higher.min_total_spent < lower.min_total_spent) {
      return `${higher.tier}: Tổng chi tiêu tối thiểu không được thấp hơn hạng ${lower.tier}.`
    }

    if (higher.min_total_visits < lower.min_total_visits) {
      return `${higher.tier}: Số lượt ghé tối thiểu không được thấp hơn hạng ${lower.tier}.`
    }

    if (higher.priority_level <= lower.priority_level) {
      return `${higher.tier}: Mức ưu tiên phải cao hơn hạng ${lower.tier}.`
    }

    if (higher.points_multiplier < lower.points_multiplier) {
      return `${higher.tier}: Hệ số điểm không được thấp hơn hạng ${lower.tier}.`
    }
  }

  return null
}

export function updateAdminTierRule(ruleId: string, input: AdminTierRuleInput) {
  const index = tierRules.findIndex((item) => item.id === ruleId)
  if (index === -1) {
    return { ok: false as const, message: 'Không tìm thấy quy tắc hạng.' }
  }

  const current = tierRules[index]
  const updated: AdminTierRule = {
    ...current,
    min_total_spent: input.min_total_spent,
    min_total_visits: input.min_total_visits,
    booking_window_days: input.booking_window_days,
    max_upcoming_bookings: input.max_upcoming_bookings,
    points_multiplier: input.points_multiplier,
    priority_level: input.priority_level,
    is_active: input.is_active,
  }

  const thresholdError = validateTierThresholds(tierRules, updated)
  if (thresholdError) {
    return { ok: false as const, message: thresholdError }
  }

  tierRules = [...tierRules.slice(0, index), updated, ...tierRules.slice(index + 1)]
  return { ok: true as const, rule: updated }
}

export function toggleAdminTierRuleActive(ruleId: string) {
  const index = tierRules.findIndex((item) => item.id === ruleId)
  if (index === -1) {
    return { ok: false as const, message: 'Không tìm thấy quy tắc hạng.' }
  }

  const current = tierRules[index]
  const updated: AdminTierRule = {
    ...current,
    is_active: !current.is_active,
  }

  tierRules = [...tierRules.slice(0, index), updated, ...tierRules.slice(index + 1)]
  return { ok: true as const, rule: updated }
}
