import { Droplets } from 'lucide-react'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-[46%] overflow-hidden bg-navy-950 lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, rgba(6,182,164,0.22), transparent 42%), radial-gradient(circle at 85% 80%, rgba(6,182,164,0.1), transparent 38%), linear-gradient(160deg, #0c1527 0%, #070d18 55%, #022f2b 100%)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.07]" aria-hidden>
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M32 0H0V32"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-xl shadow-brand-950/40">
              <Droplets className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">Carivo</p>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-300/90">
                Staff Operations
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-12">
          <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight text-white">
            Trung tâm điều hành garage thông minh
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
            Quản lý booking, buồng rửa và quy trình dịch vụ trên một nền tảng
            chuyên nghiệp dành cho đội ngũ vận hành.
          </p>

          <ul className="mt-8 space-y-3.5 text-sm text-slate-300">
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-300">
                1
              </span>
              Check-in & walk-in nhanh tại quầy
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-300">
                2
              </span>
              Giám sát buồng rửa theo thời gian thực
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-300">
                3
              </span>
              Quy trình dịch vụ chuẩn hóa end-to-end
            </li>
          </ul>
        </div>
      </aside>

      <main className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Carivo Staff</p>
                <p className="text-xs font-medium text-slate-500">Operations Console</p>
              </div>
            </div>
          </div>

          <div className="carivo-panel p-8 shadow-[var(--shadow-carivo-md)]">
            <div className="mb-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">
                Đăng nhập
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitle}</p>
            </div>

            {children}
          </div>

          {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
        </div>
      </main>
    </div>
  )
}
