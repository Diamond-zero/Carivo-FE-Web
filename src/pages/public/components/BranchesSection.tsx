import { MapPin, Phone, Star } from 'lucide-react'
import { branches } from '../data/publicHomeData'

export function BranchesSection() {
  return (
    <section id="branches" className="bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-bold uppercase text-brand-700">Liên hệ & chi nhánh</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Garage gần bạn</h2>
            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-950">
                <Phone className="h-4 w-4 text-brand-600" />
                0988 579 068
              </p>
              <p className="mt-2 text-sm text-slate-600">Tư vấn và đặt lịch mỗi ngày</p>
            </div>
          </div>
          <div className="grid gap-3">
            {branches.map((branch) => (
              <div
                key={branch}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
              >
                <span className="flex items-center gap-3 text-sm font-bold text-slate-800">
                  <MapPin className="h-4 w-4 text-brand-600" />
                  {branch}
                </span>
                <span className="hidden items-center gap-1 text-xs font-bold text-amber-600 sm:inline-flex">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  4.9
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
