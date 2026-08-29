import { Gift, Loader2 } from 'lucide-react'
import { getApiErrorMessage } from '../../../api/client'
import { getTierLabel } from '../../../constants/loyaltyTier'
import { EmptyState } from '../../../components/ui/EmptyState'
import { useLoyaltyTiers } from '../../../hooks/api/useLoyaltyTiers'

export function LoyaltySection() {
  const { data: tiers = [], isLoading, isError, error } = useLoyaltyTiers()

  return (
    <section id="loyalty" className="bg-white py-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-sm font-bold uppercase text-brand-700">Loyalty Program</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Tích điểm và ưu tiên lịch theo hạng
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Quyền lợi loyalty được cập nhật trực tiếp từ hệ thống.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 p-8 text-sm text-slate-500 sm:col-span-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải hạng loyalty...
            </div>
          ) : isError ? (
            <div className="sm:col-span-2">
              <EmptyState
                icon={Gift}
                title="Không thể tải hạng loyalty"
                description={getApiErrorMessage(error, 'Vui lòng thử lại sau.')}
              />
            </div>
          ) : tiers.length === 0 ? (
            <div className="sm:col-span-2">
              <EmptyState
                icon={Gift}
                title="Chưa có hạng loyalty"
                description="Các hạng loyalty sẽ hiển thị khi hệ thống được cấu hình."
              />
            </div>
          ) : (
            tiers
              .slice()
              .sort((a, b) => a.priority_level - b.priority_level)
              .map((tier) => (
                <div key={tier.tier_name} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-950">{getTierLabel(tier.tier_name)}</span>
                    <Gift className="h-5 w-5 text-brand-600" />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Tối thiểu {tier.min_total_points.toLocaleString('vi-VN')} điểm
                  </p>
                  <p className="mt-1 text-sm font-bold text-brand-700">
                    Tích điểm ×{tier.point_multiplier}
                  </p>
                </div>
              ))
          )}
        </div>
      </div>
    </section>
  )
}
