import {
  Globe,
  KeyRound,
  LogOut,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  User,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../../components/layout/PageHeader'
import { SettingsInfoRow } from '../../../components/settings/SettingsInfoRow'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { useInitialPageSkeleton } from '../../../hooks/useInitialPageSkeleton'
import { cn } from '../../../lib/utils'

const ADMIN_PERMISSIONS = [
  'Quản lý garage & buồng rửa toàn hệ thống',
  'Quản lý nhân viên & khách hàng',
  'Cấu hình gói dịch vụ, loyalty & khuyến mãi',
  'Xem analytics & can thiệp booking mọi chi nhánh',
]

export function AdminSettingsPage() {
  const navigate = useNavigate()
  const { session, logout } = useAdminAuth()
  const isLoading = useInitialPageSkeleton(240)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (isLoading || !session) {
    return (
      <div>
        <DashboardPageSkeleton />
      </div>
    )
  }

  const { user } = session

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Admin"
        title="Cài đặt"
        description="Xem thông tin tài khoản quản trị viên và quản lý phiên đăng nhập."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5 text-slate-500" />
              Thông tin cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-xl font-bold text-violet-800">
                {user.full_name.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{user.full_name}</p>
                <span className="mt-1 inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-800 ring-1 ring-inset ring-violet-200">
                  Quản trị viên
                </span>
              </div>
            </div>

            <dl>
              <SettingsInfoRow
                label="Số điện thoại"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {user.phone}
                  </span>
                }
              />
              <SettingsInfoRow
                label="Email"
                value={
                  user.email ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {user.email}
                    </span>
                  ) : (
                    '—'
                  )
                }
              />
              <SettingsInfoRow
                label="Trạng thái tài khoản"
                value={
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                      user.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700',
                    )}
                  >
                    {user.is_active ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                  </span>
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-violet-600" />
              Vai trò & quyền hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <SettingsInfoRow
                label="Vai trò"
                value={
                  <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-800 ring-1 ring-inset ring-violet-200">
                    ADMIN
                  </span>
                }
              />
              <SettingsInfoRow
                label="Phạm vi truy cập"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-slate-400" />
                    Toàn hệ thống Carivo
                  </span>
                }
              />
              <SettingsInfoRow label="Mã người dùng" value={user.id} />
            </dl>

            <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Quyền quản trị
              </p>
              <ul className="space-y-1.5">
                {ADMIN_PERMISSIONS.map((item) => (
                  <li key={item} className="text-sm text-slate-600">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-5 w-5 text-slate-500" />
              Bảo mật tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-slate-500">
              Phase 1 chỉ hỗ trợ xem thông tin tài khoản. Đổi mật khẩu và chỉnh sửa hồ sơ
              sẽ được bổ sung khi nối API theo{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                AdminAPI.md
              </code>
              .
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Phiên đăng nhập</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Đăng xuất để kết thúc phiên quản trị. Bạn có thể đăng nhập lại bằng tài khoản
              Admin tại{' '}
              <Link to="/login" className="font-medium text-brand-700 hover:underline">
                trang đăng nhập
              </Link>
              .
            </p>
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
