import { Gift } from 'lucide-react'
import { loyaltyTiers } from '../data/publicHomeData'

export function LoyaltySection() {
  return (
    <section id="loyalty" className="bg-white py-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-sm font-bold uppercase text-brand-700">Loyalty Program</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">
            Tích điểm và ưu tiên lịch theo hạng
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Bronze, Silver, Gold và Platinum dùng để mở rộng ngày đặt trước, hệ số tích
            điểm và quyền ưu tiên waitlist.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {loyaltyTiers.map((item) => (
            <div key={item.tier} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-950">{item.tier}</span>
                <Gift className="h-5 w-5 text-brand-600" />
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Đặt trước {item.bookingWindow}
              </p>
              <p className="mt-1 text-sm font-bold text-brand-700">
                Tích điểm {item.multiplier}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
