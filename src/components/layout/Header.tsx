import { LogOut, Menu, MapPin } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { STAFF_TYPE_COLORS, STAFF_TYPE_LABELS } from '../../constants/staffType'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate()
  const { session, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!session) return null

  const { user, staffProfile, garage } = session

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 shadow-[var(--shadow-carivo-sm)] backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-700" />

      <div className="flex h-[4.25rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl border border-slate-200/80 bg-white p-2 text-slate-600 shadow-[var(--shadow-carivo-sm)] hover:bg-slate-50 lg:hidden"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 rounded-xl border border-slate-200/70 bg-slate-50/80 px-3 py-2">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              <MapPin className="h-4 w-4 shrink-0 text-brand-600" />
              <span className="truncate">{garage.name}</span>
            </div>
            <p className="truncate text-xs text-slate-500">{garage.address}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/settings"
            className="hidden items-center gap-3 rounded-xl border border-slate-200/70 bg-white px-3 py-2 transition-colors hover:border-brand-200 hover:bg-brand-50/40 sm:flex"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
              {user.full_name.charAt(0)}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900">{user.full_name}</p>
              <p className="text-xs text-slate-500">{staffProfile.staff_code}</p>
            </div>
          </Link>

          <span
            className={cn(
              'hidden rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset sm:inline-flex',
              STAFF_TYPE_COLORS[staffProfile.staff_type],
            )}
          >
            {STAFF_TYPE_LABELS[staffProfile.staff_type]}
          </span>

          <Button variant="secondary" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
