import type { DiscountType } from '../types/promotion'
import { getAdminPromotionsFromStore } from '../mocks/admin/adminPromotionStore'
import { normalizeSearchText } from './booking'

export function searchAdminPromotions(
  query: string,
  discountTypeFilter: DiscountType | 'ALL' = 'ALL',
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL',
) {
  const normalizedQuery = normalizeSearchText(query.trim())

  return getAdminPromotionsFromStore()
    .filter((promo) => {
      if (discountTypeFilter !== 'ALL' && promo.discount_type !== discountTypeFilter) {
        return false
      }

      if (statusFilter === 'ACTIVE' && !promo.is_active) {
        return false
      }

      if (statusFilter === 'INACTIVE' && promo.is_active) {
        return false
      }

      if (!normalizedQuery) return true

      const code = normalizeSearchText(promo.code)
      const name = normalizeSearchText(promo.name)
      return code.includes(normalizedQuery) || name.includes(normalizedQuery)
    })
    .sort((a, b) => a.code.localeCompare(b.code))
}
