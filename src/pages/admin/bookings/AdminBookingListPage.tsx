import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Clock, Download, XCircle } from 'lucide-react'
import { getApiErrorMessage } from '../../../api/client'
import { AdminBookingListFilters } from '../../../components/admin/booking/AdminBookingListFilters'
import { AdminBookingListTable } from '../../../components/admin/booking/AdminBookingListTable'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useToast } from '../../../contexts/ToastContext'
import { exportBookingsToCsv } from '../../../utils/adminBookingExport'
import {
  ADMIN_BOOKING_PAGE_SIZE,
  useAdminBookingList,
  useAdminBookingStats,
} from '../../../hooks/api/admin/useAdminBookings'
import { useAdminGarages } from '../../../hooks/api/admin/useAdminGarages'
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
  const [page, setPage] = useState(1)

  const listQuery = useAdminBookingList(
    filters,
    page,
    ADMIN_BOOKING_PAGE_SIZE,
  )
  const statsQuery = useAdminBookingStats()
  const garageQuery = useAdminGarages()
  const { allGarages } = garageQuery

  const bookings = listQuery.data?.bookings ?? []
  const meta = listQuery.data?.meta
  const totalPages = Math.max(meta?.total_pages ?? 1, 1)

  const garageNameById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const garage of allGarages) {
      map[garage.id] = garage.name
    }
    return map
  }, [allGarages])

  const hasActiveFilter = hasActiveAdminBookingFilters(filters)
  const isLoading = listQuery.isLoading || statsQuery.isLoading

  const handleFilterChange = (nextFilters: AdminBookingFilters) => {
    setPage(1)
    setFilters(nextFilters)
  }

  const handleResetFilters = () => {
    setPage(1)
    setFilters(DEFAULT_ADMIN_BOOKING_FILTERS)
  }

  useEffect(() => {
    if (listQuery.isError) {
      showToast(getApiErrorMessage(listQuery.error, 'Không tải được danh sách booking.'), 'error')
    }
  }, [listQuery.isError, listQuery.error, showToast])

  useEffect(() => {
    if (statsQuery.isError) {
      showToast(
        getApiErrorMessage(
          statsQuery.error,
          'Không tải được thống kê booking toàn hệ thống.',
        ),
        'error',
      )
    }
  }, [showToast, statsQuery.error, statsQuery.isError])

  useEffect(() => {
    if (garageQuery.isError) {
      showToast(
        getApiErrorMessage(
          garageQuery.error,
          'Không tải được danh sách garage.',
        ),
        'error',
      )
    }
  }, [garageQuery.isError, garageQuery.error, showToast])

  useEffect(() => {
    if (
      garageQuery.isLoading ||
      garageQuery.isError ||
      filters.garageId === 'ALL'
    ) {
      return
    }

    if (!allGarages.some((garage) => garage.id === filters.garageId)) {
      setPage(1)
      setFilters((current) => ({ ...current, garageId: 'ALL' }))
    }
  }, [
    allGarages,
    filters.garageId,
    garageQuery.isError,
    garageQuery.isLoading,
  ])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

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
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (bookings.length === 0) {
                    showToast('Không có booking để xuất.', 'error')
                    return
                  }
                  exportBookingsToCsv(bookings)
                  showToast(
                    `Đã xuất ${bookings.length} booking trên trang ${page} ra CSV.`,
                    'success',
                  )
                }}
              >
                <Download className="h-4 w-4" />
                Xuất CSV
              </Button>
            }
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
              garages={allGarages}
              isGarageLoading={garageQuery.isLoading}
              isGarageError={garageQuery.isError}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {meta?.total ?? bookings.length} booking
                {hasActiveFilter ? ' (đã lọc)' : ''}
                {meta ? ` · Trang ${meta.page}/${totalPages}` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <AdminBookingListTable
                bookings={bookings}
                hasActiveFilter={hasActiveFilter}
                garageNameById={garageNameById}
              />
            </CardContent>
            {meta && totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-sm text-slate-600">
                <span>
                  Trang {meta.page} / {totalPages} · {meta.total} booking
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    disabled={page <= 1 || listQuery.isFetching}
                  >
                    Trước
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setPage((current) =>
                        Math.min(totalPages, current + 1),
                      )
                    }
                    disabled={page >= totalPages || listQuery.isFetching}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        </>
      )}
    </div>
  )
}
