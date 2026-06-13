import {
  Car,
  ClipboardCheck,
  Droplets,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { AuthInteractiveGrid } from './AuthInteractiveGrid'

type AuthMode = 'login' | 'register'

interface AuthLayoutProps {
  title: string
  subtitle: string
  eyebrow?: string
  mode?: AuthMode
  children: ReactNode
  footer?: ReactNode
}

const heroContent: Record<
  AuthMode,
  { headline: string; description: string; highlights: string[] }
> = {
  login: {
    headline: 'Trung tâm điều hành garage thông minh',
    description:
      'Đăng nhập để quản lý booking, buồng rửa và quy trình dịch vụ trên một nền tảng chuyên nghiệp dành cho đội ngũ vận hành.',
    highlights: [
      'Check-in & walk-in nhanh tại quầy',
      'Giám sát buồng rửa theo thời gian thực',
      'Quy trình dịch vụ chuẩn hóa end-to-end',
    ],
  },
  register: {
    headline: 'Gia nhập đội ngũ vận hành Carivo',
    description:
      'Tạo tài khoản để bắt đầu quy trình onboarding. Quản trị viên sẽ kích hoạt quyền Staff sau khi xác minh thông tin.',
    highlights: [
      'Hồ sơ nhân viên được quản lý tập trung',
      'Phân vai theo loại công việc tại garage',
      'Bảo mật và kiểm soát truy cập theo garage',
    ],
  },
}

const statCards = [
  { label: 'Garage vận hành', value: '24/7', icon: Car },
  { label: 'Booking/ngày', value: '120+', icon: ClipboardCheck },
  { label: 'Đội ngũ Staff', value: '4 vai trò', icon: Users },
]

export function AuthLayout({
  title,
  subtitle,
  eyebrow,
  mode = 'login',
  children,
  footer,
}: AuthLayoutProps) {
  const hero = heroContent[mode]
  const badgeLabel = eyebrow ?? (mode === 'login' ? 'Đăng nhập hệ thống' : 'Đăng ký tài khoản')

  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-[44%] overflow-hidden bg-navy-950 xl:flex xl:flex-col xl:justify-between">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 18%, rgba(6,182,164,0.24), transparent 44%), radial-gradient(circle at 88% 78%, rgba(6,182,164,0.12), transparent 40%), linear-gradient(165deg, #0c1527 0%, #070d18 52%, #022f2b 100%)',
          }}
        />
        <AuthInteractiveGrid />

        <div className="pointer-events-none relative z-10 p-10 xl:p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-xl shadow-brand-950/40">
              <Droplets className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">Carivo</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-300/90">
                Staff Operations
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-none relative z-10 px-10 xl:px-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-200">
            <Sparkles className="h-3.5 w-3.5" />
            AutoWash Pro Platform
          </div>

          <h2 className="max-w-lg text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
            {hero.headline}
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-400">
            {hero.description}
          </p>

          <ul className="mt-8 space-y-3">
            {hero.highlights.map((item, index) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/20 text-xs font-bold text-brand-300">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/5 bg-navy-900/50 px-3 py-3"
              >
                <stat.icon className="mb-2 h-4 w-4 text-brand-400" />
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none relative z-10 flex items-center gap-2 px-10 py-8 text-xs text-slate-500 xl:px-12">
          <ShieldCheck className="h-4 w-4 text-brand-500/70" />
          Tài khoản Staff vào cổng vận hành garage. Tài khoản Admin vào cổng quản trị hệ thống.
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col justify-center overflow-hidden px-5 py-10 sm:px-8 lg:px-12">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 100% 0%, rgba(6,182,164,0.08), transparent 40%), radial-gradient(circle at 0% 100%, rgba(15,23,42,0.04), transparent 38%)',
          }}
          aria-hidden
        />

        <div className="relative mx-auto w-full max-w-[440px]">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-900/20">
                  <Droplets className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Carivo Staff</p>
                  <p className="text-xs font-medium text-slate-500">Operations Console</p>
                </div>
              </div>
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                {mode === 'login' ? 'Login' : 'Register'}
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[var(--shadow-carivo-lg)] ring-1 ring-slate-900/[0.04] backdrop-blur-sm">
            <div className="h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-700" />

            <div className="p-8 sm:p-9">
              <div className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">
                  {badgeLabel}
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
                  {title}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitle}</p>
              </div>

              {children}
            </div>
          </div>

          {footer ? (
            <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
