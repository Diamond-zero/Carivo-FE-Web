import {
  CheckCircle2,
  Clock3,
  Filter,
  ListChecks,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  SearchX,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookingListFilters } from '../../components/booking/BookingListFilters'
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge'
import { MarkPaidModal } from '../../components/booking/MarkPaidModal'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  PageHeaderSkeleton,
  TableRowsSkeleton,
} from '../../components/ui/Skeleton'
import { useAuth } from '../../contexts/AuthContext'
import { useBookings } from '../../contexts/BookingContext'
import { useToast } from '../../contexts/ToastContext'
import { getApiErrorMessage } from '../../api/client'
import { useStaffBookingList } from '../../hooks/api/staff/useStaffBookingList'
import type { Booking } from '../../types/booking'
import {
  DEFAULT_BOOKING_FILTERS,
  type BookingFilters,
} from '../../utils/bookingFilters'
import { formatPrice, formatTime } from '../../utils/format'
import { getBookingCustomerName } from '../../utils/booking'
import { getBookingListAction } from '../../utils/bookingActionGuards'
import { useStaffCapabilities } from '../../hooks/useCan'
import type { StaffCapability } from '../../constants/staffCapabilities'

const PAGE_SIZE = 10

export function BookingListPage() {
  const { session } = useAuth()
  const { markBookingPaid, createPayosPayment } = useBookings()
  const { showToast } = useToast()
  const staffCapabilities = useStaffCapabilities()
  const staffType = session?.staffProfile.staff_type
  const showOperationsSummary = staffType !== 'VEHICLE_INSPECTION_STAFF'
  const [filters, setFilters] = useState<BookingFilters>(
    DEFAULT_BOOKING_FILTERS,
  )
  const [markPaidBooking, setMarkPaidBooking] = useState<Booking | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useStaffBookingList(filters)

  const allBookings = data?.bookings ?? []

  const visibleBookings = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return allBookings
    return allBookings.filter((booking) => {
      const plate = booking.license_plate?.toLowerCase() ?? ''
      const name = getBookingCustomerName(booking).toLowerCase()
      return plate.includes(normalized) || name.includes(normalized)
    })
  }, [allBookings, search])

  const totalPages = Math.max(1, Math.ceil(visibleBookings.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = visibleBookings.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  const summary = useMemo(() => {
    return {
      total: allBookings.length,
      confirmed: allBookings.filter((b) => b.status === 'CONFIRMED').length,
      inProgress: allBookings.filter((b) => b.status === 'IN_PROGRESS').length,
      completed: allBookings.filter((b) => b.status === 'COMPLETED').length,
      canceled: allBookings.filter((b) =>
        b.status === 'CANCELED' || b.status === 'NO_SHOW',
      ).length,
      revenue: allBookings.reduce(
        (sum, b) => (b.status === 'COMPLETED' ? sum + (b.final_price ?? 0) : sum),
        0,
      ),
    }
  }, [allBookings])

  const handleMarkPaid = async () => {
    if (!markPaidBooking) {
      return { success: false, message: 'Không xác định được booking.' }
    }
    const result = await markBookingPaid(markPaidBooking.id)
    if (result.success) {
      showToast(result.message, 'success')
      void refetch()
    }
    return result
  }

  const handlePayos = async () => {
    if (!markPaidBooking) {
      return { success: false, message: 'Không xác định được booking.' }
    }
    const result = await createPayosPayment(markPaidBooking.id)
    if (result.success) {
      showToast(result.message, 'success')
      void refetch()
    }
    return {
      success: result.success,
      message: result.message,
      checkoutUrl: result.checkoutUrl,
    }
  }

  const isFiltered =
    filters.status !== 'ALL' ||
    Boolean(filters.date) ||
    Boolean(filters.licensePlate) ||
    Boolean(filters.phone)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/dashboard" className="hover:text-slate-900">
          Lịch hẹn
        </Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-slate-900">Danh sách lịch hẹn</span>
      </nav>

      {isLoading ? (
        <>
          <PageHeaderSkeleton />
          <TableRowsSkeleton rows={6} columns={7} />
        </>
      ) : (
        <>
          {/* Page Header */}
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900">
                Quản lý lịch hẹn
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Lấy dữ liệu từ GET /admin/bookings — lọc theo trạng thái, ngày,
                biển số hoặc SĐT.
                {isFetching ? ' · đang cập nhật...' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Làm mới
              </Button>
              {staffCapabilities.includes('booking.walk_in.create') ? (
                <Link to="/bookings/walk-in">
                  <Button>
                    <Plus className="h-4 w-4" />
                    Tạo lịch mới
                  </Button>
                </Link>
              ) : null}
            </div>
          </header>

          {/* Bento Stats */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Tổng lịch đặt"
              value={summary.total}
              icon={ListChecks}
              accent="bg-brand-100 text-brand-800"
            />
            <SummaryCard
              label="Đã xác nhận"
              value={summary.confirmed}
              icon={CheckCircle2}
              accent="bg-emerald-100 text-emerald-700"
            />
            <SummaryCard
              label="Đang thực hiện"
              value={summary.inProgress}
              icon={Clock3}
              accent="bg-amber-100 text-amber-700"
            />
            {showOperationsSummary ? (
              <SummaryCard
                label="Đã hủy"
                value={summary.canceled}
                icon={XCircle}
                accent="bg-rose-100 text-rose-700"
              />
            ) : null}
          </section>

          {/* Filter Row */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <BookingListFilters
              filters={filters}
              onChange={setFilters}
              onReset={() => {
                setFilters(DEFAULT_BOOKING_FILTERS)
                setPage(1)
              }}
            />
          </section>

          {isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {getApiErrorMessage(error, 'Không thể tải danh sách booking.')}
            </div>
          ) : null}

          {/* Table Container */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Lịch hẹn sắp tới
                </h2>
              <p className="text-xs text-slate-500">
                {visibleBookings.length} kết quả
                {isFiltered ? ' (đã lọc)' : ''}
                {showOperationsSummary ? (
                  <>
                    {' · '}Doanh thu hoàn thành:{' '}
                    <span className="font-semibold text-emerald-700">
                      {formatPrice(summary.revenue)}
                    </span>
                  </>
                ) : null}
              </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setPage(1)
                  }}
                  placeholder="Tìm theo biển số hoặc tên khách..."
                  className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            <div className="p-0">
              {paginated.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title="Không tìm thấy booking"
                  description="Thử đổi bộ lọc hoặc xóa điều kiện tìm kiếm."
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setFilters(DEFAULT_BOOKING_FILTERS)
                        setSearch('')
                        setPage(1)
                      }}
                    >
                      <Filter className="h-4 w-4" />
                      Xóa bộ lọc
                    </Button>
                  }
                  compact
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Mã</th>
                          <th className="px-4 py-3">Khách hàng</th>
                          <th className="px-4 py-3">Phương tiện</th>
                          <th className="px-4 py-3">Loại dịch vụ</th>
                          <th className="px-4 py-3">Khung giờ</th>
                          <th className="px-4 py-3">Trạng thái</th>
                          <th className="px-4 py-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginated.map((booking, idx) => (
                          <tr
                            key={booking.id}
                            className={
                              idx % 2 === 1
                                ? 'bg-slate-50/50 hover:bg-slate-50'
                                : 'hover:bg-slate-50/60'
                            }
                          >
                            <td className="px-4 py-3">
                              <Link
                                to={`/bookings/${booking.id}`}
                                className="text-sm font-semibold text-brand-700 hover:underline"
                              >
                                {booking.id.replace('booking-', '#')}
                              </Link>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800">
                                  {getBookingCustomerName(booking)
                                    .split(' ')
                                    .map((p) => p.charAt(0))
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase() || 'KH'}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {getBookingCustomerName(booking)}
                                  </p>
                                  <p className="truncate text-xs text-slate-500">
                                    {booking.customer_phone ?? 'Walk-in'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-slate-900">
                                {booking.license_plate}
                              </p>
                              <p className="text-xs text-slate-500">
                                {booking.vehicle_type === 'CAR'
                                  ? 'Ô tô'
                                  : 'Xe máy'}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                {booking.service_package_name ??
                                  'Chưa gán gói'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-slate-900">
                                {formatTime(booking.start_time)} –{' '}
                                {formatTime(booking.end_time)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {booking.booking_date
                                  .split('-')
                                  .reverse()
                                  .join('/')}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <BookingStatusBadge status={booking.status} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <BookingTableAction
                                booking={booking}
                                staffGarageId={session?.staffProfile.garage_id}
                                staffCapabilities={staffCapabilities}
                                onMarkPaid={setMarkPaidBooking}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <p className="text-xs text-slate-500">
                      Trang {safePage} / {totalPages} ·{' '}
                      {visibleBookings.length} kết quả
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={safePage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Trước
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={safePage >= totalPages}
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {markPaidBooking ? (
            <MarkPaidModal
              open={Boolean(markPaidBooking)}
              onClose={() => setMarkPaidBooking(null)}
              booking={markPaidBooking}
              onConfirmCash={handleMarkPaid}
              onConfirmPayos={handlePayos}
            />
          ) : null}
        </>
      )}
    </div>
  )
}

interface SummaryCardProps {
  label: string
  value: number
  icon: typeof ListChecks
  accent: string
}

function SummaryCard({ label, value, icon: Icon, accent }: SummaryCardProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-900">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-[28px] font-bold leading-tight tracking-tight text-slate-900">
          {value}
        </p>
      </div>
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${accent}`}
      >
        <Icon className="h-6 w-6" />
      </span>
    </div>
  )
}

interface BookingTableActionProps {
  booking: Booking
  staffGarageId?: string
  staffCapabilities: StaffCapability[]
  onMarkPaid: (booking: Booking) => void
}

function BookingTableAction({
  booking,
  staffGarageId,
  staffCapabilities,
  onMarkPaid,
}: BookingTableActionProps) {
  const action = getBookingListAction(booking, staffGarageId)
  if (!action) {
    return <span className="text-xs text-slate-400">—</span>
  }
  if (!staffCapabilities.includes(action.requiredCapability)) {
    return <span className="text-xs text-slate-400">—</span>
  }
  if (action.type === 'mark_paid') {
    return (
      <Button
        variant="secondary"
        size="sm"
        disabled={!action.guard.allowed}
        title={action.guard.reason}
        onClick={() => onMarkPaid(booking)}
      >
        {action.label}
      </Button>
    )
  }
  if (!action.guard.allowed || !action.to) {
    return (
      <Button variant="secondary" size="sm" disabled title={action.guard.reason}>
        {action.label}
      </Button>
    )
  }
  return (
    <Link to={action.to}>
      <Button variant="secondary" size="sm">
        {action.label}
      </Button>
    </Link>
  )
}