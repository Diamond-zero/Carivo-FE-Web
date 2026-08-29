import type { VoucherType } from '../types/voucherTemplate'

export const VOUCHER_TEMPLATE_TYPES: VoucherType[] = [
  'FIXED_AMOUNT',
  'PERCENTAGE',
  'FREE_SERVICE',
]

export const VOUCHER_TEMPLATE_TYPE_LABELS: Record<VoucherType, string> = {
  FIXED_AMOUNT: 'Giảm số tiền cố định',
  PERCENTAGE: 'Giảm theo phần trăm',
  FREE_SERVICE: 'Tặng gói dịch vụ',
}
