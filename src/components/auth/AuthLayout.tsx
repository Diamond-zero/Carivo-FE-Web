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
      <aside className="relative hidden w-[45%] overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-slate-900 to-cyan-500/10" />
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <Droplets className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Carivo</p>
              <p className="text-sm text-slate-400">AutoWash Pro</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-12">
          <h2 className="max-w-md text-3xl font-semibold leading-tight text-white">
            Hệ thống quản lý rửa xe thông minh
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
            Vận hành garage hiệu quả — quản lý booking, buồng rửa và dịch vụ
            trên một nền tảng duy nhất.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Check-in & walk-in nhanh chóng
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Theo dõi buồng rửa realtime
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Quy trình dịch vụ chuẩn hóa
            </li>
          </ul>
        </div>
      </aside>

      <main className="flex flex-1 flex-col justify-center bg-gray-50 px-6 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Carivo</p>
                <p className="text-xs text-slate-500">AutoWash Pro</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
              <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
            </div>

            {children}
          </div>

          {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
        </div>
      </main>
    </div>
  )
}
