import {
  Building2,
  Clock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { SettingsInfoRow } from '../../components/settings/SettingsInfoRow'
import { Button } from '../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { STAFF_TYPE_COLORS, STAFF_TYPE_LABELS } from '../../constants/staffType'
import { useAuth } from '../../contexts/AuthContext'
import { useInitialPageSkeleton } from '../../hooks/useInitialPageSkeleton'
import { cn } from '../../lib/utils'

export function SettingsPage() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
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

  const { user, staffProfile, garage } = session

  return (
    <div>
      <PageHeader
        title="Cài đặt"
        description="Xem thông tin tài khoản nhân viên và garage đang làm việc."
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
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-800">
                {user.full_name.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{user.full_name}</p>
                <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  Nhân viên
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
              <Shield className="h-5 w-5 text-slate-500" />
              Thông tin nhân viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <SettingsInfoRow label="Mã nhân viên" value={staffProfile.staff_code} />
              <SettingsInfoRow
                label="Vai trò"
                value={
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                      STAFF_TYPE_COLORS[staffProfile.staff_type],
                    )}
                  >
                    {STAFF_TYPE_LABELS[staffProfile.staff_type]}
                  </span>
                }
              />
              <SettingsInfoRow
                label="Trạng thái nhân viên"
                value={
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                      staffProfile.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700',
                    )}
                  >
                    {staffProfile.is_active ? 'Đang làm việc' : 'Ngưng làm việc'}
                  </span>
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-slate-500" />
              Garage làm việc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-0 sm:grid-cols-2 sm:gap-x-8">
              <SettingsInfoRow label="Tên garage" value={garage.name} />
              <SettingsInfoRow label="Mã garage" value={garage.garage_code} />
              <SettingsInfoRow
                label="Địa chỉ"
                value={
                  <span className="inline-flex items-start gap-1.5 text-right sm:max-w-xs sm:text-left">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    {garage.address}, {garage.city}
                  </span>
                }
              />
              <SettingsInfoRow
                label="Hotline"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {garage.phone}
                  </span>
                }
              />
              <SettingsInfoRow
                label="Giờ mở cửa"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {garage.opening_time} – {garage.closing_time}
                  </span>
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Phiên đăng nhập</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Đăng xuất để kết thúc phiên làm việc và quay lại trang đăng nhập.
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
