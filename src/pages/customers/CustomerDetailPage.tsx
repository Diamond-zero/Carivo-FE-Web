import { ArrowLeft, Mail, Phone, UserX } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CustomerGarageBookings } from '../../components/customer/CustomerGarageBookings'
import { CustomerVehicleList } from '../../components/customer/CustomerVehicleList'
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
import { useStaffCustomerDetail } from '../../hooks/api/staff/useStaffCustomerDetail'

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <Navigate to="/customers" replace />
  }

  const {
    profile,
    garageBookings,
    vehicles,
    atGarage,
    isLoading,
  } = useStaffCustomerDetail(id)

  const user = profile?.user

  if (!isLoading && (!user || !atGarage)) {
    return (
      <div>
        <PageHeader
          title="Không tìm thấy khách hàng"
          description="Khách không tồn tại hoặc chưa có booking tại garage của bạn."
          action={
            <Link to="/customers">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Quay lại
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

  return (
    <div>
      {isLoading || !user ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            title={user.full_name}
            description="Thông tin khách từ GET /admin/customers và booking theo customer_id."
            action={
              <Link to="/customers">
                <Button variant="secondary">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </Button>
              </Link>
            }
          />

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card>
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
                    <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      Khách hàng
                    </span>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {user.phone || '—'}
                  </div>
                  {user.email ? (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {user.email}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Phương tiện</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerVehicleList vehicles={vehicles} />
              </CardContent>
            </Card>
          </div>

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
        </>
      )}
    </div>
  )
}
