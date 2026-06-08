import type { TierUpgradeRecord } from '../types/loyalty'

export const mockTierUpgradeHistory: TierUpgradeRecord[] = [
  {
    id: 'tier-up-001',
    customer_id: 'user-cus-001',
    from_tier: 'SILVER',
    to_tier: 'GOLD',
    upgraded_at: '2026-03-15T10:30:00',
    reason: 'Đạt ngưỡng chi tiêu và số lần ghé thăm theo quy tắc hệ thống',
  },
  {
    id: 'tier-up-002',
    customer_id: 'user-cus-001',
    from_tier: 'BRONZE',
    to_tier: 'SILVER',
    upgraded_at: '2025-11-02T14:00:00',
    reason: 'Tự động nâng hạ sau kỳ review tier hàng tháng',
  },
  {
    id: 'tier-up-003',
    customer_id: 'user-cus-002',
    from_tier: 'BRONZE',
    to_tier: 'SILVER',
    upgraded_at: '2026-01-20T09:15:00',
    reason: 'Đạt ngưỡng chi tiêu và số lần ghé thăm theo quy tắc hệ thống',
  },
  {
    id: 'tier-up-004',
    customer_id: 'user-cus-004',
    from_tier: 'GOLD',
    to_tier: 'PLATINUM',
    upgraded_at: '2026-05-01T08:00:00',
    reason: 'Tự động nâng hạ sau kỳ review tier hàng tháng',
  },
  {
    id: 'tier-up-005',
    customer_id: 'user-cus-004',
    from_tier: 'SILVER',
    to_tier: 'GOLD',
    upgraded_at: '2025-08-10T16:45:00',
    reason: 'Đạt ngưỡng chi tiêu và số lần ghé thăm theo quy tắc hệ thống',
  },
]
