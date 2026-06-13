import type { DiscountType } from '../types/promotion'

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: 'Phần trăm (%)',
  FIXED_AMOUNT: 'Số tiền cố định (VND)',
}

export const DISCOUNT_TYPES: DiscountType[] = ['PERCENTAGE', 'FIXED_AMOUNT']
