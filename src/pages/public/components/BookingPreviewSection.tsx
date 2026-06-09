import { Button } from '../../../components/ui/Button'
import {
  bookingBranches,
  bookingServices,
  timeSlots,
} from '../data/publicHomeData'

export function BookingPreviewSection() {
  return (
    <section id="booking" className="border-y border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-brand-700">Booking online</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Chọn lịch phù hợp trong vài bước
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              UI này đang dùng dữ liệu tĩnh để demo flow. Khi nối backend, form sẽ gọi API
              kiểm tra slot, promotion và điểm loyalty.
            </p>
          </div>

          <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-[var(--shadow-carivo-md)] md:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-500">Chi nhánh</span>
              <select className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15">
                {bookingBranches.map((branch) => (
                  <option key={branch}>{branch}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-500">Dịch vụ</span>
              <select className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15">
                {bookingServices.map((service) => (
                  <option key={service}>{service}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-500">Ngày hẹn</span>
              <input
                type="date"
                defaultValue="2026-06-10"
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
              />
            </label>
            <div className="flex items-end">
              <Button fullWidth className="h-11">
                Tìm giờ trống
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {timeSlots.map((slot) => (
            <button
              key={slot}
              className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
            >
              {slot}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
