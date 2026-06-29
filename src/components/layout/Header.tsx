import { LogOut, MapPin, Search, Bell, HelpCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { STAFF_TYPE_COLORS, STAFF_TYPE_LABELS } from '../../constants/staffType'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick: _onMenuClick }: HeaderProps) {
  const navigate = useNavigate()
  const { session, logout } = useAuth()

  const handleLogout = () => {
    void logout().then(() => navigate('/login'))
  }

  if (!session) return null

  const { user, staffProfile, garage } = session

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight text-slate-900">
              Carivo Staff
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{garage.name}</span>
            </div>
          </div>
        </div>

        <div className="hidden flex-1 max-w-sm md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Tìm biển số, khách hàng, mã booking..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 sm:inline-flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-700">Ca đang hoạt động</span>
          </div>

          <button
            type="button"
            aria-label="Thông báo"
            className="relative hidden rounded-full p-2 text-slate-500 hover:bg-slate-100 sm:inline-flex"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <button
            type="button"
            aria-label="Trợ giúp"
            className="hidden rounded-full p-2 text-slate-500 hover:bg-slate-100 sm:inline-flex"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">{user.full_name}</p>
            <p className="text-[11px] text-slate-500">{staffProfile.staff_code}</p>
          </div>

          <span
            className={cn(
              'hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex',
              STAFF_TYPE_COLORS[staffProfile.staff_type],
            )}
          >
            {STAFF_TYPE_LABELS[staffProfile.staff_type]}
          </span>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            aria-label="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  )
}
