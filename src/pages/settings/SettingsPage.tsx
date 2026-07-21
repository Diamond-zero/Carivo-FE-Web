import {

  Building2,

  Clock,

  Loader2,

  LogOut,

  Mail,

  MapPin,

  Phone,

  RefreshCw,

  Shield,

  User,

} from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import { getApiErrorMessage } from '../../api/client'

import { ChangePasswordForm } from '../../components/settings/ChangePasswordForm'
import { EditProfileForm } from '../../components/settings/EditProfileForm'
import { StaffCapabilitiesCard } from '../../components/settings/StaffCapabilitiesCard'
import { StaffTypeChangeCard } from '../../components/settings/StaffTypeChangeCard'
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

import { useStaffSettings } from '../../hooks/api/staff/useStaffSettings'
import { useStaffCapabilities } from '../../hooks/api/staff/useStaffTypeChangeRequests'

import { cn } from '../../lib/utils'



export function SettingsPage() {

  const { session, logout } = useAuth()

  const navigate = useNavigate()

  const {

    isLoading,

    isFetching,

    isError,

    error,

    refetch,

  } = useStaffSettings()

  const capabilitiesQuery = useStaffCapabilities()



  const handleLogout = () => {

    void logout().then(() => navigate('/login'))

  }



  const handleRefresh = () => {

    void refetch()

  }



  if (!session || isLoading) {

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

        description="Xem và cập nhật thông tin tài khoản, đổi mật khẩu và garage đang làm việc."

        action={

          <Button

            variant="secondary"

            size="sm"

            onClick={handleRefresh}

            disabled={isFetching}

          >

            {isFetching ? (

              <Loader2 className="h-4 w-4 animate-spin" />

            ) : (

              <RefreshCw className="h-4 w-4" />

            )}

            Làm mới

          </Button>

        }

      />



      {isError ? (

        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          {getApiErrorMessage(

            error,

            'Không thể tải hồ sơ nhân viên. Vui lòng thử lại.',

          )}

        </div>

      ) : null}



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

            <div className="mt-6 border-t border-slate-100 pt-6">
              <p className="mb-4 text-sm font-medium text-slate-700">
                Cập nhật hồ sơ
              </p>
              <EditProfileForm />
            </div>

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

              <SettingsInfoRow

                label="Khoảng slot"

                value={`${garage.slot_interval_minutes} phút`}

              />

            </dl>

          </CardContent>

        </Card>



        <Card className="lg:col-span-2">

          <CardHeader>

            <CardTitle className="text-base">Đổi mật khẩu</CardTitle>

          </CardHeader>

          <CardContent>

            <ChangePasswordForm />

          </CardContent>

        </Card>



        <StaffCapabilitiesCard
          capabilities={capabilitiesQuery.data?.capabilities ?? []}
          isLoading={capabilitiesQuery.isLoading}
          errorMessage={
            capabilitiesQuery.isError
              ? getApiErrorMessage(capabilitiesQuery.error, 'Không tải được quyền.')
              : null
          }
        />

        <StaffTypeChangeCard currentStaffType={staffProfile.staff_type} />

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


