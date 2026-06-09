import { BadgeCheck, ChevronRight } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { heroImage, heroStats } from '../data/publicHomeData'

export function HeroSection() {
  return (
    <section
      id="top"
      className="relative flex min-h-[680px] items-end overflow-hidden bg-slate-950 pt-28 text-white"
    >
      <img
        src={heroImage}
        alt="Kỹ thuật viên chăm sóc ô tô trong trung tâm rửa xe"
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.94),rgba(2,6,23,0.62),rgba(2,6,23,0.15))]" />
      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 pb-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-brand-300/30 bg-brand-500/10 px-3 py-2 text-xs font-bold uppercase text-brand-100">
            <BadgeCheck className="h-4 w-4" />
            Hệ thống booking rửa xe thông minh
          </div>
          <h1 className="max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
            Carivo Wash & Detailing
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-100 sm:text-lg">
            Đặt lịch rửa xe, chọn chi nhánh gần bạn, theo dõi tiến độ dịch vụ và tích điểm
            thành viên trong một trải nghiệm gọn gàng.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#booking">
              <Button size="lg">
                Đặt lịch ngay
                <ChevronRight className="h-5 w-5" />
              </Button>
            </a>
            <a href="#services">
              <Button
                size="lg"
                variant="secondary"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Xem bảng dịch vụ
              </Button>
            </a>
          </div>
        </div>

        <div className="grid content-end gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-md"
            >
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-200">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
