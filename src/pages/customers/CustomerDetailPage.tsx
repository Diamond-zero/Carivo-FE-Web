import { ArrowLeft, Mail, Phone, UserX } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CustomerGarageBookings } from '../../components/customer/CustomerGarageBookings'
import { CustomerVehicleList } from '../../components/customer/CustomerVehicleList'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
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
      <div className="space-y-6">
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
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-12">
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
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isLoading || !user ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <Link
              to="/customers"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại danh sách
            </Link>
            <span className="text-xs text-slate-500">
              {garageBookings.length} booking tại garage
            </span>
          </div>

          <div className="flex flex-wrap items-start gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-600">
              {user.full_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {user.full_name}
              </h1>
              <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                Khách hàng
              </span>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {user.phone || '—'}
                </div>
                {user.email ? (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {user.email}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-slate-200 shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Phương tiện
                </h2>
              </div>
              <CardContent>
                <CustomerVehicleList vehicles={vehicles} />
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Booking tại garage
                </h2>
              </div>
              <CardContent className="p-0 pb-2">
                <CustomerGarageBookings bookings={garageBookings} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}