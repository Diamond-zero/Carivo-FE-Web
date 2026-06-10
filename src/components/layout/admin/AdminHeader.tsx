import { LogOut, Menu, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'

interface AdminHeaderProps {
  onMenuClick: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const navigate = useNavigate()
  const { session, logout } = useAdminAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6 lg:px-7">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-sm font-bold text-slate-900">Bảng điều khiển quản trị</p>
            <p className="text-xs text-slate-500">Toàn hệ thống Carivo</p>
          </div>
        </div>

        {session ? (
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <Shield className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-medium text-slate-700">
                {session.user.full_name}
              </span>
              <Badge className="bg-violet-50 text-violet-800 ring-violet-200">ADMIN</Badge>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
