import { ArrowLeft, Mail, Phone, UserX } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CustomerGarageBookings } from '../../components/customer/CustomerGarageBookings'
import { CustomerLoyaltyCard } from '../../components/customer/CustomerLoyaltyCard'
import { CustomerVehicleList } from '../../components/customer/CustomerVehicleList'
import { LoyaltyPointHistoryList } from '../../components/customer/LoyaltyPointHistoryList'
import { TierBadge } from '../../components/customer/TierBadge'
import { TierUpgradeHistoryList } from '../../components/customer/TierUpgradeHistoryList'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { useAuth } from '../../contexts/AuthContext'
import { useBookings } from '../../contexts/BookingContext'
import { useInitialPageSkeleton } from '../../hooks/useInitialPageSkeleton'
import {
  getCustomerById,
  getCustomerLoyalty,
  getCustomerVehicles,
  getGarageBookingsForCustomer,
  getLoyaltyPointHistoryForCustomer,
  getTierUpgradeHistoryForCustomer,
  isCustomerAtGarage,
} from '../../utils/customerLookup'

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useAuth()
  const { bookings } = useBookings()
  const isLoading = useInitialPageSkeleton(280)

  const garageId = session?.staffProfile.garage_id ?? ''

  if (!id) {
    return <Navigate to="/customers" replace />
  }

  const user = getCustomerById(id)
  const loyalty = getCustomerLoyalty(id)
  const atGarage = isCustomerAtGarage(id, bookings, garageId)

  if (!isLoading && (!user || !loyalty || !atGarage)) {
    return (
      <div>
        <PageHeader
          title="Không tìm thấy khách hàng"
          description="Khách không tồn tại hoặc chưa có booking tại garage của bạn."
          action={
            <Link to="/customers">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách
              </Button>
            </Link>
          }
        />
        <EmptyState
          icon={UserX}
          title="Không có quyền xem khách này"
          description="Staff chỉ tra cứu khách đã từng đặt lịch tại garage được gán."
          action={
            <Link to="/customers">
              <Button>Về danh sách khách</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const vehicles = getCustomerVehicles(id)
  const garageBookings = getGarageBookingsForCustomer(id, bookings, garageId)
  const tierUpgrades = getTierUpgradeHistoryForCustomer(id)
  const pointHistory = getLoyaltyPointHistoryForCustomer(id)

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : user && loyalty ? (
        <>
          <PageHeader
            title={user.full_name}
            description="Thông tin khách hàng read-only — không chỉnh sửa điểm hoặc hạng loyalty."
            action={
              <Link to="/customers">
                <Button variant="secondary">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </Button>
              </Link>
            }
          />

          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Hồ sơ khách</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-600">
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
                  <p className="text-xs text-slate-500">
                    Trạng thái tài khoản:{' '}
                    {user.is_active ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                  </p>
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
                  Booking tại garage ({garageBookings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 pb-2">
                <CustomerGarageBookings bookings={garageBookings} />
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}
