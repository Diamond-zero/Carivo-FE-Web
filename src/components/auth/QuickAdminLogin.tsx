import { Shield } from 'lucide-react'
import { mockAdminUser } from '../../mocks/users'
import { cn } from '../../lib/utils'

interface QuickAdminLoginProps {
  onSelect: (phone: string, password: string) => void
  selectedPhone?: string
}

export function QuickAdminLogin({ onSelect, selectedPhone }: QuickAdminLoginProps) {
  const isSelected = selectedPhone === mockAdminUser.phone

  return (
    <div className="mt-4">
      <div className="rounded-2xl border border-dashed border-violet-200/80 bg-gradient-to-br from-violet-50/50 to-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Đăng nhập nhanh Admin</p>
            <p className="text-xs text-slate-500">
              Chọn tài khoản quản trị demo để điền form tự động
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelect(mockAdminUser.phone, mockAdminUser.password)}
          className={cn(
            'w-full rounded-xl border bg-white p-3 text-left shadow-[var(--shadow-carivo-sm)] transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[var(--shadow-carivo-md)]',
            isSelected
              ? 'border-violet-400 ring-2 ring-violet-500/20'
              : 'border-slate-200/90',
          )}
        >
          <div className="flex items-start gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/15 to-violet-600/10 text-sm font-bold text-violet-700">
              {mockAdminUser.full_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {mockAdminUser.full_name}
                </p>
                <span className="shrink-0 rounded-full bg-violet-50 px-1.5 py-0.5 text-[9px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-500">{mockAdminUser.email}</p>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="rounded-lg bg-slate-50 px-2 py-1.5">
              <p className="text-slate-400">SĐT</p>
              <p className="font-semibold text-slate-700">{mockAdminUser.phone}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-2 py-1.5">
              <p className="text-slate-400">MK</p>
              <p className="truncate font-semibold text-slate-700">
                {mockAdminUser.password}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
