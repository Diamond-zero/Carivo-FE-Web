import { Zap } from 'lucide-react'
import { STAFF_TYPE_COLORS, STAFF_TYPE_LABELS } from '../../constants/staffType'
import { mockQuickLoginAccounts } from '../../mocks/users'
import { cn } from '../../lib/utils'

interface QuickStaffLoginProps {
  onSelect: (phone: string, password: string) => void
  selectedPhone?: string
}

export function QuickStaffLogin({
  onSelect,
  selectedPhone,
}: QuickStaffLoginProps) {
  return (
    <div className="mt-8">
      <div className="relative mb-4 flex items-center">
        <div className="flex-1 border-t border-slate-200" />
        <span className="mx-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
          Demo nhanh
        </span>
        <div className="flex-1 border-t border-slate-200" />
      </div>

      <div className="rounded-2xl border border-dashed border-brand-200/70 bg-gradient-to-br from-brand-50/50 to-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Đăng nhập nhanh Staff</p>
            <p className="text-xs text-slate-500">Chọn tài khoản demo để điền form tự động</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {mockQuickLoginAccounts.map(({ user, staffProfile }) => {
            const isSelected = selectedPhone === user.phone

            return (
              <button
                key={user.id}
                type="button"
                onClick={() => onSelect(user.phone, user.password)}
                className={cn(
                  'rounded-xl border bg-white p-3 text-left shadow-[var(--shadow-carivo-sm)] transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[var(--shadow-carivo-md)]',
                  isSelected
                    ? 'border-brand-400 ring-2 ring-brand-500/20'
                    : 'border-slate-200/90',
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/15 to-brand-600/10 text-sm font-bold text-brand-700">
                    {user.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {user.full_name}
                      </p>
                      <span
                        className={cn(
                          'hidden shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1 ring-inset sm:inline-flex',
                          STAFF_TYPE_COLORS[staffProfile.staff_type],
                        )}
                      >
                        {STAFF_TYPE_LABELS[staffProfile.staff_type]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{staffProfile.staff_code}</p>
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                    <p className="text-slate-400">SĐT</p>
                    <p className="font-semibold text-slate-700">{user.phone}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                    <p className="text-slate-400">MK</p>
                    <p className="truncate font-semibold text-slate-700">{user.password}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
