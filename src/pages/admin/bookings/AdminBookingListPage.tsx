import { CalendarDays, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AdminBookingListFilters } from '../../../components/admin/booking/AdminBookingListFilters'
import { AdminBookingListTable } from '../../../components/admin/booking/AdminBookingListTable'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useInitialPageSkeleton } from '../../../hooks/useInitialPageSkeleton'
import { getAdminBookingsFromStore } from '../../../mocks/admin/adminBookingStore'
import {
  DEFAULT_ADMIN_BOOKING_FILTERS,
  hasActiveAdminBookingFilters,
  searchAdminBookings,
  type AdminBookingFilters,
} from '../../../utils/adminBookingLookup'

export function AdminBookingListPage() {
  const [filters, setFilters] = useState<AdminBookingFilters>(
    DEFAULT_ADMIN_BOOKING_FILTERS,
  )
  const [refreshKey, setRefreshKey] = useState(0)
  const isLoading = useInitialPageSkeleton(280)

  const allBookings = useMemo(
    () => getAdminBookingsFromStore(),
    [refreshKey],
  )

  const bookings = useMemo(
    () => searchAdminBookings(filters),
    [filters, refreshKey],
  )

  const inProgressCount = allBookings.filter(
    (booking) => booking.status === 'IN_PROGRESS',
  ).length
  const completedCount = allBookings.filter(
    (booking) => booking.status === 'COMPLETED',
  ).length
  const canceledCount = allBookings.filter((booking) =>
    ['CANCELED', 'NO_SHOW'].includes(booking.status),
  ).length
  const hasActiveFilter = hasActiveAdminBookingFilters(filters)

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Admin"
            title="Bookings"
            description="Xem và can thiệp booking trên toàn hệ thống — lọc theo garage, trạng thái, ngày và loại xe."
          />

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Tổng booking"
              value={allBookings.length}
              icon={CalendarDays}
              accent="brand"
            />
            <StatCard
              label="Đang thực hiện"
              value={inProgressCount}
              icon={Clock}
              accent="amber"
            />
            <StatCard
              label="Hoàn thành"
              value={completedCount}
              icon={CheckCircle2}
              accent="emerald"
            />
            <StatCard
              label="Hủy / No-show"
              value={canceledCount}
              icon={XCircle}
              accent="violet"
            />
          </div>

          <div className="mb-6">
            <AdminBookingListFilters
              filters={filters}
              onChange={setFilters}
              onReset={() => {
                setFilters(DEFAULT_ADMIN_BOOKING_FILTERS)
                setRefreshKey((value) => value + 1)
              }}
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
