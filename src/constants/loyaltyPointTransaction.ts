import type { ApiPointTransactionType } from '../types/api/admin'

export const LOYALTY_POINT_TRANSACTION_LABELS: Record<ApiPointTransactionType, string> = {
  EARN: 'Tích lũy',
  REDEEM: 'Sử dụng',
  REFUND: 'Hoàn điểm',
  EXPIRE: 'Hết hạn',
  ADJUST: 'Điều chỉnh',
}

export const LOYALTY_POINT_TRANSACTION_COLORS: Record<ApiPointTransactionType, string> = {
  EARN: 'bg-emerald-100 text-emerald-700',
  REDEEM: 'bg-brand-50 text-brand-800 ring-1 ring-brand-100',
  REFUND: 'bg-cyan-100 text-cyan-700',
  EXPIRE: 'bg-amber-100 text-amber-700',
  ADJUST: 'bg-violet-100 text-violet-700',
}

export const LOYALTY_POINT_TRANSACTION_TYPES: ApiPointTransactionType[] = [
  'EARN',
  'REDEEM',
  'REFUND',
  'EXPIRE',
  'ADJUST',
]