import { Award, Coins, Gift, TrendingUp } from 'lucide-react'
import {
  getNextTier,
  getTierRule,
  LOYALTY_TIER_CARD_BG,
  LOYALTY_TIER_LABELS,
} from '../../constants/loyaltyTier'
import type { CustomerLoyalty } from '../../types/loyalty'
import { formatPrice } from '../../utils/format'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/Card'
import { TierBadge } from './TierBadge'

interface CustomerLoyaltyCardProps {
  loyalty: CustomerLoyalty
}

export function CustomerLoyaltyCard({ loyalty }: CustomerLoyaltyCardProps) {
  const tierRule = getTierRule(loyalty.current_tier)
  const nextTier = getNextTier(loyalty.current_tier)

  return (
    <Card className="overflow-hidden">
      <div
        className={`bg-gradient-to-br ${LOYALTY_TIER_CARD_BG[loyalty.current_tier]} px-6 py-5`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-600">Hạng loyalty hiện tại</p>
            <div className="mt-2 flex items-center gap-2">
              <Award className="h-5 w-5 text-slate-700" />
              <TierBadge tier={loyalty.current_tier} className="text-sm" />
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">Điểm khả dụng</p>
            <p className="text-2xl font-semibold text-slate-900">
              {loyalty.available_points}
            </p>
          </div>
        </div>
      </div>

      <CardHeader>
        <CardTitle className="text-base">Thông tin loyalty</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
          <Coins className="mt-0.5 h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm text-slate-500">Tổng điểm tích lũy</p>
            <p className="font-semibold text-slate-900">{loyalty.total_points}</p>
            <p className="mt-1 text-xs text-slate-500">
              Đã đổi: {loyalty.redeemed_points} · Hết hạn: {loyalty.expired_points}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
          <TrendingUp className="mt-0.5 h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-sm text-slate-500">Tổng chi tiêu</p>
            <p className="font-semibold text-slate-900">
              {formatPrice(loyalty.total_spent)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {loyalty.total_visits} lượt ghé thăm
            </p>
          </div>
        </div>

        {tierRule ? (
          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <Gift className="mt-0.5 h-5 w-5 text-violet-600" />
            <div>
              <p className="text-sm text-slate-500">Quyền lợi hạng hiện tại</p>
              <p className="text-sm text-slate-800">
                Hệ số tích điểm ×{tierRule.points_multiplier} · Đặt trước tối đa{' '}
                {tierRule.max_upcoming_bookings} booking · Cửa sổ đặt{' '}
                {tierRule.booking_window_days} ngày
              </p>
              {nextTier ? (
                <p className="mt-1 text-xs text-slate-500">
                  Hạng tiếp theo: {LOYALTY_TIER_LABELS[nextTier]}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">Đã ở hạng cao nhất</p>
              )}
            </div>
          </div>
        ) : null}

        {loyalty.expiring_points.length > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:col-span-2">
            <p className="text-sm font-medium text-amber-900">Điểm sắp hết hạn</p>
            <ul className="mt-2 space-y-1">
              {loyalty.expiring_points.map((item, index) => (
                <li key={index} className="text-sm text-amber-800">
                  {item.points} điểm — hết hạn{' '}
                  {new Date(item.expires_at).toLocaleDateString('vi-VN')}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
