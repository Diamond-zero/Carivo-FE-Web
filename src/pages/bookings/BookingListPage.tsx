import {
  Award,
  CheckCircle2,
  Clock3,
  Filter,
  ListChecks,
  Loader2,
  Plus,
  RefreshCw,
  ScanSearch,
  Search,
  SearchX,
  Wrench,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { BookingListFilters } from '../../components/booking/BookingListFilters'
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge'
import { ClaimInspectionModal } from '../../components/booking/ClaimInspectionModal'
import { MarkPaidModal } from '../../components/booking/MarkPaidModal'
import { PaymentStatusBadge } from '../../components/booking/PaymentStatusBadge'
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
import {
  useClaimInspection,
  useWorkspaceBookings,
} from '../../hooks/api/staff/useWorkspaceBookings'
import { useStaffBookingList } from '../../hooks/api/staff/useStaffBookingList'
import { mapApiBooking } from '../../lib/mappers/staffMappers'
import {
  hasAvailableAction,
  mapWorkspaceBookings,
} from '../../lib/mappers/workspaceMappers'
import {
  staffQueryKeys,
  workspaceQueryKeys,
} from '../../hooks/api/staff/queryKeys'
import { useMyCapabilities } from '../../hooks/api/staff/useStaffCapabilities'
import type { StaffCapability } from '../../constants/staffCapabilities'
import type { Booking } from '../../types/booking'
import type { ApiBookingItem } from '../../types/api/staff'
import {
  DEFAULT_BOOKING_FILTERS,
  type BookingFilters,
} from '../../utils/bookingFilters'
import { formatPrice, formatTime } from '../../utils/format'
import {
  getBookingCustomerName,
  getBookingDisplayName,
  getBookingInitials,
  getBookingPhone,
} from '../../utils/booking'
import { normalizeSearchText } from '../../utils/booking'
import { getBookingListAction, getClaimInspectionGuard } from '../../utils/bookingActionGuards'

const PAGE_SIZE = 10

export function BookingListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const garageId = session?.staffProfile.garage_id
  const { markBookingPaid, createPayosPayment } = useBookings()
  const { showToast } = useToast()
  const staffCapabilities = useMyCapabilities()
  const claimInspection = useClaimInspection()
  const [filters, setFilters] = useState<BookingFilters>(
    DEFAULT_BOOKING_FILTERS,
  )
  const [markPaidBooking, setMarkPaidBooking] = useState<Booking | null>(null)
  const [claimBooking, setClaimBooking] = useState<Booking | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  // Nguồn dữ liệu booking cho staff list:
  //  - Staff có `booking.read_garage` (admin/CUSTOMER_SERVICE_STAFF/...) → dùng
  //    `/admin/bookings` (BE trả full customer, final_price, earned_points, etc.).
  //  - Staff chỉ có `booking.read_assigned` (VEHICLE_INSPECTION_STAFF) → dùng
  //    `/staff/workspace/bookings` (redacted; cho phép thấy booking CHECKED_IN
  //    chưa assigned để tự nhận kiểm tra). Endpoint này cũng trả
  //    `available_actions` riêng theo staff context (single source of truth
  //    cho nút "Nhận kiểm tra").
  const useAdminSource = staffCapabilities.includes('booking.read_garage')

  const adminList = useStaffBookingList(filters)
  const workspaceList = useWorkspaceBookings({
    status: filters.status,
    date: filters.date,
  })

  const adminSource = useAdminSource ? adminList : null
  const workspaceSource = useAdminSource ? null : workspaceList

  const isLoading = adminSource?.isLoading ?? workspaceSource?.isLoading ?? false
  const isFetching = adminSource?.isFetching ?? workspaceSource?.isFetching ?? false
  const isError = adminSource?.isError ?? workspaceSource?.isError ?? false
  const error = adminSource?.error ?? workspaceSource?.error ?? null
  const refetch = adminSource?.refetch ?? workspaceSource?.refetch ?? (() => undefined)

  const allBookings = useMemo(() => {
    if (adminSource?.data) {
      return adminSource.data.bookings.map(mapApiBooking)
    }
    if (workspaceSource?.data?.bookings) {
      return mapWorkspaceBookings(workspaceSource.data.bookings)
    }
    return []
  }, [adminSource, workspaceSource])

  const visibleBookings = useMemo(() => {
    const normalized = normalizeSearchText(search)
    // Với admin source: plate/phone đã filter server-side qua param `search`.
    // Với workspace source: BE không hỗ trợ search → phải filter client-side.
    const plateFilter = useAdminSource ? '' : normalizeSearchText(filters.licensePlate)
    const phoneFilter = useAdminSource ? '' : normalizeSearchText(filters.phone)

    return allBookings.filter((booking) => {
      // Header search: tên khách / SĐT / biển số
      if (normalized) {
        const plate = normalizeSearchText(booking.license_plate ?? '')
        const name = normalizeSearchText(getBookingCustomerName(booking))
        const phone = normalizeSearchText(getBookingPhone(booking) ?? '')
        if (
          !plate.includes(normalized) &&
          !name.includes(normalized) &&
          !phone.includes(normalized)
        ) {
          return false
        }
      }
      // Filter panel: biển số (chỉ áp dụng cho workspace source vì admin source
      // đã filter qua `search` param của BE)
      if (
        plateFilter &&
        !normalizeSearchText(booking.license_plate ?? '').includes(plateFilter)
      ) {
        return false
      }
      // Filter panel: SĐT
      if (
        phoneFilter &&
        !normalizeSearchText(getBookingPhone(booking) ?? '').includes(phoneFilter)
      ) {
        return false
      }
      return true
    })
  }, [allBookings, search, filters.licensePlate, filters.phone, useAdminSource])

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

  const handleConfirmClaim = async () => {
    if (!claimBooking) return
    try {
      await claimInspection.mutateAsync(claimBooking.id)
      // Đợi các query liên quan refetch xong trước khi navigate để InspectionPage
      // nhận được data mới (assigned_inspection_staff_id === currentUserId).
      // Trước đây user phải logout/login lại vì list cũ còn `assigned = null`
      // → InspectionPage filter loại bỏ booking.
      await queryClient.refetchQueries({
        queryKey: staffQueryKeys.bookings(garageId),
      })
      await queryClient.refetchQueries({
        queryKey: workspaceQueryKeys.bookings(),
      })
      showToast('Đã nhận kiểm tra booking thành công.', 'success')
      setClaimBooking(null)
      navigate(`/service/inspection?bookingId=${claimBooking.id}`)
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Không thể nhận kiểm tra booking này.',
      )
      showToast(message, 'error')
      void refetch()
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
                {useAdminSource
                  ? 'Lấy dữ liệu từ GET /admin/bookings — hiển thị đầy đủ tên khách, thành tiền, điểm thưởng.'
                  : 'Lấy dữ liệu từ GET /staff/workspace/bookings — danh sách tối ưu cho nhân viên kiểm tra xe (lọc theo trạng thái, ngày).'}
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
            <SummaryCard
              label="Đã hủy"
              value={summary.canceled}
              icon={XCircle}
              accent="bg-rose-100 text-rose-700"
            />
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
                          <th className="px-4 py-3">Thành tiền</th>
                          <th className="px-4 py-3">Điểm</th>
                          <th className="px-4 py-3">TT thanh toán</th>
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
                                #{booking.id.slice(0, 8)}
                              </Link>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800">
                                  {getBookingInitials(booking)}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p
                                      className="truncate text-sm font-semibold text-slate-900"
                                      title={getBookingDisplayName(booking).displayName}
                                    >
                                      {getBookingDisplayName(booking).displayName}
                                    </p>
                                    {getBookingDisplayName(booking).isWalkIn ? (
                                      <span
                                        className="inline-flex shrink-0 items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700"
                                        title="Walk-in: nhân viên không nhập được thông tin khách (BE chưa trả is_walk_in)"
                                      >
                                        Walk-in
                                      </span>
                                    ) : null}
                                  </div>
                                  <p
                                    className="truncate text-xs text-slate-500"
                                    title={getBookingPhone(booking) || undefined}
                                  >
                                    {getBookingPhone(booking) || 'Không có SĐT'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-slate-900">
                                {booking.license_plate || (
                                  <span className="font-normal italic text-slate-400">
                                    Chưa nhập biển số
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500">
                                {booking.vehicle_type === 'CAR'
                                  ? 'Ô tô'
                                  : booking.vehicle_type === 'MOTORBIKE'
                                    ? 'Xe máy'
                                    : 'Khác'}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <ServicePackageCell booking={booking} />
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-slate-900">
                                {formatTime(booking.start_time)} –{' '}
                                {formatTime(booking.end_time)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {booking.booking_date
                                  ? booking.booking_date
                                      .split('-')
                                      .reverse()
                                      .join('/')
                                  : '—'}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              {renderFinalPrice(booking)}
                            </td>
                            <td className="px-4 py-3">
                              {renderEarnedPoints(booking)}
                            </td>
                            <td className="px-4 py-3">
                              <PaymentStatusBadge status={booking.payment_status} />
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
                                onClaim={setClaimBooking}
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

          {claimBooking ? (
            <ClaimInspectionModal
              open={Boolean(claimBooking)}
              booking={claimBooking}
              isSubmitting={claimInspection.isPending}
              onClose={() => setClaimBooking(null)}
              onConfirm={handleConfirmClaim}
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

/**
 * Render cột "Loại dịch vụ":
 *  - Dòng đầu: tên gói chính (`service_package.name`).
 *  - Dòng tiếp theo: các add-on (`booking_items` với `source = 'ADD_ON'`),
 *    mỗi item là một dòng nhỏ với prefix "Add-on:".
 *  - Fallback khi không có data → "Chưa gán gói".
 */
function ServicePackageCell({ booking }: { booking: Booking }) {
  const mainName = booking.service_package_name?.trim()
  const rawItems = (booking.raw as { booking_items?: ApiBookingItem[] } | undefined)
    ?.booking_items
  const addOns = Array.isArray(rawItems)
    ? rawItems.filter((item) => item?.source === 'ADD_ON')
    : []

  if (!mainName && addOns.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        Chưa gán gói
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {mainName ? (
        <span className="inline-flex items-center gap-1 self-start rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          <Wrench className="h-3 w-3 text-slate-500" />
          {mainName}
        </span>
      ) : null}
      {addOns.map((item) => (
        <span
          key={item.item_key ?? item.name_snapshot}
          className="inline-flex items-center gap-1 self-start rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
          title="Add-on đính kèm booking"
        >
          <Plus className="h-3 w-3" />
          {item.name_snapshot}
        </span>
      ))}
    </div>
  )
}

/**
 * Render cột "Thành tiền":
 *  - final_price > 0 → format VND
 *  - final_price = 0 VÀ status COMPLETED → "0 ₫" (gói miễn phí / khuyến mãi)
 *  - Các trạng thái khác → "Chưa tính" (booking chưa xong nên BE chưa set final_price)
 */
function renderFinalPrice(booking: Booking) {
  const price = booking.final_price ?? 0
  if (price > 0) {
    return (
      <p className="text-sm font-semibold text-slate-900">
        {formatPrice(price)}
      </p>
    )
  }
  if (price === 0 && booking.status === 'COMPLETED') {
    return (
      <p
        className="text-sm font-medium text-emerald-700"
        title="Booking hoàn thành với thành tiền = 0 (vd: khuyến mãi 100%)"
      >
        0&nbsp;₫
      </p>
    )
  }
  return (
    <p
      className="text-xs italic text-slate-400"
      title="Thành tiền sẽ được tính khi booking hoàn thành"
    >
      Chưa tính
    </p>
  )
}

/**
 * Render cột "Điểm" (earned_points):
 *  - BE chỉ set `earned_points > 0` sau khi booking được đánh dấu PAID + reward
 *    đã được xử lý (bookingReward.service). Vì vậy nếu payment_status chưa
 *    PAID thì điểm phải là "Chưa cộng" dù BE có trả > 0.
 *  - earned_points > 0 VÀ PAID → "+X điểm" với icon Award
 *  - earned_points = 0 VÀ PAID → "0 điểm" (đã thanh toán nhưng không tích)
 *  - Còn lại (UNPAID/PENDING/PARTIAL/REFUNDED) → "Chưa cộng" với tooltip
 */
function renderEarnedPoints(booking: Booking) {
  const points = booking.earned_points ?? 0
  const isPaid = booking.payment_status === 'PAID'

  if (points > 0 && isPaid) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
        <Award className="h-3 w-3" />+{points} điểm
      </span>
    )
  }
  if (points === 0 && isPaid) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"
        title="Booking đã thanh toán nhưng không tích điểm"
      >
        0 điểm
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-xs italic text-slate-400"
      title="Điểm thưởng sẽ được cộng sau khi booking thanh toán PAID"
    >
      <Award className="h-3 w-3" />Chưa cộng
    </span>
  )
}

interface BookingTableActionProps {
  booking: Booking
  staffGarageId?: string
  staffCapabilities: StaffCapability[]
  onMarkPaid: (booking: Booking) => void
  onClaim: (booking: Booking) => void
}

function BookingTableAction({
  booking,
  staffGarageId,
  staffCapabilities,
  onMarkPaid,
  onClaim,
}: BookingTableActionProps) {
  const canClaimInspection = staffCapabilities.includes(
    'inspection.claim_garage',
  )
  // BE workspace list trả `available_actions` cho từng staff context — đây là
  // nguồn xác thực duy nhất (single source of truth) cho việc có được phép
  // nhận kiểm tra booking này hay không. `getClaimInspectionGuard` mirror lại
  // điều kiện BE chỉ dùng làm fallback khi dữ liệu thiếu `available_actions`
  // (vd khi admin dùng /admin/bookings cũ hoặc cache stale).
  const hasClaimAction = hasAvailableAction(booking, 'inspection.claim')
  const claimGuard = getClaimInspectionGuard(booking, staffGarageId)
  const canClaim =
    canClaimInspection && (hasClaimAction || claimGuard.allowed)

  const action = getBookingListAction(booking, staffGarageId)
  if (!action && !canClaim) {
    return <span className="text-xs text-slate-400">—</span>
  }

  const handleClaimClick = () => {
    onClaim(booking)
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {canClaim ? (
        <Button
          variant="primary"
          size="sm"
          onClick={handleClaimClick}
        >
          <ScanSearch className="h-4 w-4" />
          Nhận kiểm tra
        </Button>
      ) : null}
      {action ? (
        <ActionBody
          booking={booking}
          action={action}
          staffCapabilities={staffCapabilities}
          onMarkPaid={onMarkPaid}
        />
      ) : null}
    </div>
  )
}

interface ActionBodyProps {
  booking: Booking
  action: NonNullable<ReturnType<typeof getBookingListAction>>
  staffCapabilities: StaffCapability[]
  onMarkPaid: (booking: Booking) => void
}

function ActionBody({
  booking,
  action,
  staffCapabilities,
  onMarkPaid,
}: ActionBodyProps) {
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