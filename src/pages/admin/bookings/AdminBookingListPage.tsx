import { useEffect, useState } from 'react'
import { CalendarDays, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { getApiErrorMessage } from '../../../api/client'
import { AdminBookingListFilters } from '../../../components/admin/booking/AdminBookingListFilters'
import { AdminBookingListTable } from '../../../components/admin/booking/AdminBookingListTable'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminBookingList,
  useAdminBookingStats,
} from '../../../hooks/api/admin/useAdminBookings'
import {
  DEFAULT_ADMIN_BOOKING_FILTERS,
  hasActiveAdminBookingFilters,
  type AdminBookingFilters,
} from '../../../utils/adminBookingLookup'

export function AdminBookingListPage() {
  const { showToast } = useToast()
  const [filters, setFilters] = useState<AdminBookingFilters>(
    DEFAULT_ADMIN_BOOKING_FILTERS,
  )

  const listQuery = useAdminBookingList(filters)
  const statsQuery = useAdminBookingStats()

  const bookings = listQuery.data?.bookings ?? []

  const hasActiveFilter = hasActiveAdminBookingFilters(filters)
  const isLoading = listQuery.isLoading || statsQuery.isLoading

  useEffect(() => {
    if (listQuery.isError) {
      showToast(getApiErrorMessage(listQuery.error, 'Không tải được danh sách booking.'), 'error')
    }
  }, [listQuery.isError, listQuery.error, showToast])

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Quản trị"
            title="Đặt lịch"
            description="Xem và can thiệp booking trên toàn hệ thống — lọc theo garage, trạng thái, ngày và loại xe."
          />

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Tổng booking"
              value={statsQuery.data?.total ?? 0}
              icon={CalendarDays}
              accent="brand"
            />
            <StatCard
              label="Đang thực hiện"
              value={statsQuery.data?.inProgress ?? 0}
              icon={Clock}
              accent="amber"
            />
            <StatCard
              label="Hoàn thành"
              value={statsQuery.data?.completed ?? 0}
              icon={CheckCircle2}
              accent="emerald"
            />
            <StatCard
              label="Hủy / Không đến"
              value={statsQuery.data?.canceled ?? 0}
              icon={XCircle}
              accent="violet"
            />
          </div>

          <div className="mb-6">
            <AdminBookingListFilters
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(DEFAULT_ADMIN_BOOKING_FILTERS)}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {bookings.length} booking
                {hasActiveFilter ? ' (đã lọc)' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <AdminBookingListTable
                bookings={bookings}
                hasActiveFilter={hasActiveFilter}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
