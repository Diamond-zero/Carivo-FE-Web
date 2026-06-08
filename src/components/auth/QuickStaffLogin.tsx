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
    <div className="mt-6 rounded-xl border border-dashed border-brand-200/80 bg-brand-50/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Zap className="h-4 w-4 text-brand-600" />
        <p className="text-sm font-semibold text-slate-800">Đăng nhập nhanh Staff</p>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Bấm vào tài khoản để điền số điện thoại và mật khẩu vào form phía trên.
      </p>

      <div className="grid gap-2">
        {mockQuickLoginAccounts.map(({ user, staffProfile }) => {
          const isSelected = selectedPhone === user.phone

          return (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelect(user.phone, user.password)}
              className={cn(
                'rounded-xl border bg-white px-3 py-3 text-left shadow-[var(--shadow-carivo-sm)] transition-all hover:border-brand-300 hover:bg-brand-50/30',
                isSelected
                  ? 'border-brand-400 ring-2 ring-brand-500/20'
                  : 'border-slate-200/90',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user.full_name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {staffProfile.staff_code}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset',
                    STAFF_TYPE_COLORS[staffProfile.staff_type],
                  )}
                >
                  {STAFF_TYPE_LABELS[staffProfile.staff_type]}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                  <p className="text-slate-400">SĐT</p>
                  <p className="font-medium text-slate-700">{user.phone}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                  <p className="text-slate-400">Mật khẩu</p>
                  <p className="font-medium text-slate-700">{user.password}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
