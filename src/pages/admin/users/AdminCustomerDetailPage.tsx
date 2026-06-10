import { ArrowLeft, Lock, Mail, Phone, Unlock, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AdminCustomerBookingsTable } from '../../../components/admin/customer/AdminCustomerBookingsTable'
import { CustomerLoyaltyCard } from '../../../components/customer/CustomerLoyaltyCard'
import { CustomerVehicleList } from '../../../components/customer/CustomerVehicleList'
import { LoyaltyPointHistoryList } from '../../../components/customer/LoyaltyPointHistoryList'
import { TierBadge } from '../../../components/customer/TierBadge'
import { TierUpgradeHistoryList } from '../../../components/customer/TierUpgradeHistoryList'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Modal } from '../../../components/ui/Modal'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import { useInitialPageSkeleton } from '../../../hooks/useInitialPageSkeleton'
import {
  getCustomerActiveStatus,
  setCustomerActiveStatus,
} from '../../../mocks/admin/customerStatusOverrides'
import { cn } from '../../../lib/utils'
import {
  getAdminBookingsForCustomer,
  getAdminCustomerLoyalty,
  getAdminCustomerUser,
  getAdminCustomerVehicles,
  getLoyaltyPointHistoryForAdminCustomer,
  getTierUpgradeHistoryForAdminCustomer,
} from '../../../utils/adminCustomerLookup'

export function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { showToast } = useToast()
  const isLoading = useInitialPageSkeleton(280)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isActive, setIsActive] = useState(true)

  const user = id ? getAdminCustomerUser(id) : undefined
  const loyalty = id ? getAdminCustomerLoyalty(id) : undefined

  useEffect(() => {
    if (!user) return
    setIsActive(getCustomerActiveStatus(user.id, user.is_active))
  }, [user])

  if (!id) {
    return <Navigate to="/admin/users/customers" replace />
  }

  if (!isLoading && (!user || !loyalty)) {
    return (
      <div>
        <PageHeader
          title="Không tìm thấy khách hàng"
          description="Khách hàng không tồn tại trong hệ thống Carivo."
          action={
            <Link to="/admin/users/customers">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách
              </Button>
            </Link>
          }
        />
        <EmptyState
          icon={UserX}
          title="Khách hàng không tồn tại"
          description="Mã khách không khớp với dữ liệu mock Admin."
          action={
            <Link to="/admin/users/customers">
              <Button>Về danh sách khách</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const vehicles = getAdminCustomerVehicles(id)
  const bookings = getAdminBookingsForCustomer(id)
  const tierUpgrades = getTierUpgradeHistoryForAdminCustomer(id)
  const pointHistory = getLoyaltyPointHistoryForAdminCustomer(id)

  const handleToggleStatus = () => {
    if (!user) return

    const nextActive = !isActive
    setCustomerActiveStatus(user.id, nextActive)
    setIsActive(nextActive)
    setConfirmOpen(false)
    showToast(
      nextActive
        ? `Đã mở khóa tài khoản ${user.full_name}.`
        : `Đã khóa tài khoản ${user.full_name}.`,
      'success',
    )
  }

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : user && loyalty ? (
        <>
          <PageHeader
            eyebrow="Carivo Admin"
            title={user.full_name}
            description="Chi tiết khách hàng toàn hệ thống — loyalty, phương tiện và lịch sử booking."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={isActive ? 'danger' : 'primary'}
                  onClick={() => setConfirmOpen(true)}
                >
                  {isActive ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Khóa tài khoản
                    </>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4" />
                      Mở khóa tài khoản
                    </>
                  )}
                </Button>
                <Link to="/admin/users/customers">
                  <Button variant="secondary">
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                  </Button>
                </Link>
              </div>
            }
          />

          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Hồ sơ khách</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-lg font-semibold text-violet-800">
                    {user.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{user.full_name}</p>
                    <TierBadge tier={loyalty.current_tier} />
                  </div>
                </div>

                <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {user.phone}
                  </div>
                  {user.email ? (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {user.email}
                    </div>
                  ) : null}
                  <p className="text-xs text-slate-500">Mã người dùng: {user.id}</p>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                      isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700',
                    )}
                  >
                    {isActive ? 'Đang hoạt động' : 'Đã khóa'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <CustomerLoyaltyCard loyalty={loyalty} />
            </div>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lịch sử nâng hạ</CardTitle>
              </CardHeader>
              <CardContent>
                <TierUpgradeHistoryList records={tierUpgrades} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lịch sử điểm loyalty</CardTitle>
              </CardHeader>
              <CardContent>
                <LoyaltyPointHistoryList records={pointHistory} />
              </CardContent>
            </Card>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Phương tiện</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerVehicleList vehicles={vehicles} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Booking toàn hệ thống ({bookings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 pb-2">
                <AdminCustomerBookingsTable bookings={bookings} />
              </CardContent>
            </Card>
          </div>

          <Modal
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            title={isActive ? 'Khóa tài khoản khách hàng?' : 'Mở khóa tài khoản khách hàng?'}
            description={
              isActive
                ? `Khách ${user.full_name} sẽ không thể đăng nhập hoặc đặt lịch cho đến khi được mở khóa.`
                : `Khách ${user.full_name} sẽ được phép sử dụng lại tài khoản.`
            }
          >
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                Hủy
              </Button>
              <Button variant={isActive ? 'danger' : 'primary'} onClick={handleToggleStatus}>
                {isActive ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
              </Button>
            </div>
          </Modal>
        </>
      ) : null}
    </div>
  )
}
