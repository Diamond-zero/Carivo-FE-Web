import type { Promotion } from '../../types/promotion'
import { mockAdminPromotions } from './promotions'

function clonePromotions(items: Promotion[]): Promotion[] {
  return items.map((promo) => ({
    ...promo,
    applicable_tiers: [...promo.applicable_tiers],
  }))
}

let promotions = clonePromotions(mockAdminPromotions)

export function getAdminPromotionsFromStore(): Promotion[] {
  return clonePromotions(promotions)
}

export function getAdminPromotionById(promotionId: string) {
  const promo = promotions.find((item) => item.id === promotionId)
  return promo ? clonePromotions([promo])[0] : undefined
}

export function isPromotionCodeTaken(code: string, excludePromotionId?: string) {
  const normalized = code.trim().toUpperCase()
  return promotions.some(
    (promo) =>
      promo.code.toUpperCase() === normalized && promo.id !== excludePromotionId,
  )
}

export type AdminPromotionInput = Omit<Promotion, 'id' | 'used_count'>

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function createAdminPromotion(input: AdminPromotionInput) {
  if (isPromotionCodeTaken(input.code)) {
    return { ok: false as const, message: 'Mã khuyến mãi đã tồn tại.' }
  }

  const promo: Promotion = {
    id: `promo-${slugify(input.code) || 'new'}-${Date.now()}`,
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    description: input.description.trim(),
    discount_type: input.discount_type,
    discount_value: input.discount_value,
    max_discount_amount: input.max_discount_amount,
    min_order_amount: input.min_order_amount,
    applicable_tiers: [...input.applicable_tiers],
    usage_limit: input.usage_limit,
    used_count: 0,
    start_at: input.start_at,
    end_at: input.end_at,
    is_active: input.is_active,
  }

  promotions = [...promotions, promo]
  return { ok: true as const, promotion: promo }
}

export function updateAdminPromotion(promotionId: string, input: AdminPromotionInput) {
  const index = promotions.findIndex((item) => item.id === promotionId)
  if (index === -1) {
    return { ok: false as const, message: 'Không tìm thấy khuyến mãi.' }
  }

  if (isPromotionCodeTaken(input.code, promotionId)) {
    return { ok: false as const, message: 'Mã khuyến mãi đã tồn tại.' }
  }

  const current = promotions[index]
  const updated: Promotion = {
    ...current,
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    description: input.description.trim(),
    discount_type: input.discount_type,
    discount_value: input.discount_value,
    max_discount_amount: input.max_discount_amount,
    min_order_amount: input.min_order_amount,
    applicable_tiers: [...input.applicable_tiers],
    usage_limit: input.usage_limit,
    start_at: input.start_at,
    end_at: input.end_at,
    is_active: input.is_active,
  }

  promotions = [...promotions.slice(0, index), updated, ...promotions.slice(index + 1)]
  return { ok: true as const, promotion: updated }
}

export function toggleAdminPromotionActive(promotionId: string) {
  const index = promotions.findIndex((item) => item.id === promotionId)
  if (index === -1) {
    return { ok: false as const, message: 'Không tìm thấy khuyến mãi.' }
  }

  const current = promotions[index]
  const updated: Promotion = {
    ...current,
    is_active: !current.is_active,
  }

  promotions = [...promotions.slice(0, index), updated, ...promotions.slice(index + 1)]
  return { ok: true as const, promotion: updated }
}
