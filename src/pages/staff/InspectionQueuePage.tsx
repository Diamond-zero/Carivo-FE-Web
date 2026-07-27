/**
 * Inspection Queue Page — trang riêng cho VEHICLE_INSPECTION_STAFF.
 *
 * Mục tiêu: hiển thị booking CHECKED_IN trong garage để staff inspection
 * nhanh chóng thấy các booking chờ nhận kiểm tra. BE đã đẩy endpoint
 * GET /staff/workspace/bookings (không filter theo staff assignment),
 * kèm available_actions = ['inspection.claim'] cho từng booking — đây là
 * nguồn xác thực duy nhất (single source of truth) để bật nút "Nhận kiểm tra".
 *
 * So với BookingListPage:
 *  - Polling 15s để bắt booking vừa check-in
 *  - Highlight row có available_actions.includes('inspection.claim')
 *  - Nút "Nhận kiểm tra" lớn (primary variant)
 *  - Cột "Trạng thái nhận": chưa nhận / bạn đã nhận / người khác
 *  - Filter chỉ có date (status cố định CHECKED_IN — queue ngữ nghĩa)
 */

import {
  CarFront,
  Loader2,
  RefreshCw,
  ScanSearch,
  SearchX,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ClaimInspectionModal } from '../../components/booking/ClaimInspectionModal'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import {
  PageHeaderSkeleton,
  TableRowsSkeleton,
} from '../../components/ui/Skeleton'
import { getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import {
  useClaimInspection,
  useWorkspaceBookings,
} from '../../hooks/api/staff/useWorkspaceBookings'
import { useInspectionQueueEnrichment } from '../../hooks/api/staff/useInspectionQueueEnrichment'
import {
  staffQueryKeys,
  workspaceQueryKeys,
} from '../../hooks/api/staff/queryKeys'
import {
  hasAvailableAction,
  mapWorkspaceBookings,
} from '../../lib/mappers/workspaceMappers'
import type { Booking } from '../../types/booking'
import { formatPrice, formatTime } from '../../utils/format'
import {
  getBookingDisplayName,
  getBookingInitials,
  getBookingPhone,
} from '../../utils/booking'
import { WORKFLOW_PHASE_LABELS } from '../../types/api/workspace'

const PAGE_SIZE = 8

export function InspectionQueuePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const { showToast } = useToast()
  const claimInspection = useClaimInspection()

  const currentUserId = session?.user.id
  const garageId = session?.staffProfile.garage_id

  const [date, setDate] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [claimBooking, setClaimBooking] = useState<Booking | null>(null)

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useWorkspaceBookings(
    { status: 'CHECKED_IN', date },
    // Polling 15s: booking mới liên tục được check-in — staff inspection
    // cần thấy queue cập nhật gần real-time để nhận kịp.
    { refetchInterval: 15_000 },
  )

  // === Mount-time cache reconciliation ===
  // Khi user navigate vào /staff/inspection-queue (đặc biệt sau khi vừa
  // logout/login, hoặc switch từ staff type khác sang KIEM_XE) cache cũ
  // của `staffQueryKeys.bookingDetail(id)` hoặc `workspaceQueryKeys.bookings`
  // có thể còn data từ session trước → `useWorkspaceBookings.staleTime: 0`
  // + `refetchOnMount: 'always'` chỉ mark stale + refetch in-background,
  // UI render lần đầu với data cũ → `canClaim`/`isMine` derive sai → cột
  // "Thao tác" trống (chỉ "—"), user phải Ctrl+R mới thấy nút. Reload
  // thì cache wipe hết → render đúng ngay. Fix: invalidate + reset cả
  // workspace + detail enrichment ngay khi mount, để query tiếp theo
  // fetch thật sự từ BE, không tận dụng cache.
  // Phạm vi: chỉ ảnh hưởng cache của garage hiện tại → an toàn multi-tenant.
  useEffect(() => {
    if (!garageId) return
    void queryClient.invalidateQueries({
      queryKey: workspaceQueryKeys.bookings(garageId),
    })
    void queryClient.invalidateQueries({
      queryKey: staffQueryKeys.bookings(garageId),
    })
    void refetch()
  }, [garageId, queryClient, refetch])

  const allBookings = useMemo(
    () => (data?.bookings ? mapWorkspaceBookings(data.bookings) : []),
    [data],
  )

  // === Enrichment ===
  // Workspace list redacted — gọi thêm detail (`/admin/bookings/:id`) cho mỗi row
  // để lấy customer.name/phone, service_package.name, final_price, points_earned.
  // Staff VEHICLE_INSPECTION_STAFF có `booking.read_assigned` nên với booking đã
  // claim sẽ trả đầy đủ; booking chưa claim (queue) → 403 → fallback sang
  // workspace data. Khi BE đẩy các field này vào workspace list, hook này
  // trở thành no-op.
  const enrichment = useInspectionQueueEnrichment(
    allBookings.map((b) => b.id),
  )

  // Merge enrichment lên workspace Booking — detail (khi có) ghi đè lên
  // workspace redacted values. Các field workflow-specific (available_actions,
  // workflow_phase) vẫn lấy từ workspace vì đó là single source of truth cho
  // capability gating.
  const enrichedBookings = useMemo(() => {
    if (allBookings.length === 0) return allBookings
    return allBookings.map((booking) => {
      const detail = enrichment.byBookingId.get(booking.id)
      if (!detail) return booking
      return {
        ...booking,
        // === Customer (priority: detail > workspace) ===
        is_walk_in: detail.is_walk_in,
        guest_name: detail.guest_name ?? booking.guest_name,
        guest_phone: detail.guest_phone ?? booking.guest_phone,
        customer_id: detail.customer_id ?? booking.customer_id,
        customer_name:
          detail.customer_name?.trim() || booking.customer_name?.trim()
            ? (detail.customer_name?.trim() || booking.customer_name?.trim()) ?? null
            : null,
        customer_phone:
          detail.customer_phone ?? booking.customer_phone ?? null,
        // === Service package (priority: detail > workspace) ===
        service_package_id: detail.service_package_id || booking.service_package_id,
        service_package_name:
          detail.service_package_name?.trim() ||
          booking.service_package_name?.trim() ||
          '',
        service_package_points_estimated:
          typeof detail.service_package_points_estimated === 'number'
            ? detail.service_package_points_estimated
            : undefined,
        // === Price / points ===
        final_price: detail.final_price ?? booking.final_price,
        earned_points:
          typeof detail.earned_points === 'number'
            ? detail.earned_points
            : booking.earned_points,
        // === Lưu detail vào raw để debug / future ===
        raw: detail.raw ?? booking.raw,
      }
    })
  }, [allBookings, enrichment.byBookingId])

  // Local search: biển số + tên khách + SĐT. Workspace API không hỗ trợ search
  // param, nhưng data set của queue đã nhỏ (chỉ CHECKED_IN) nên filter client OK.
  const visibleBookings = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return enrichedBookings
    return enrichedBookings.filter((booking) => {
      const plate = (booking.license_plate ?? '').toLowerCase()
      const name = (booking.customer_name ?? '').toLowerCase()
      const phone = (getBookingPhone(booking) ?? '').toLowerCase()
      return plate.includes(q) || name.includes(q) || phone.includes(q)
    })
  }, [enrichedBookings, search])

  // Stats chỉ tính trên data hiện tại (1 ngày / không filter date = hôm nay).
  const stats = useMemo(() => {
    const claimable = allBookings.filter((b) =>
      hasAvailableAction(b, 'inspection.claim'),
    )
    const claimedByMe = allBookings.filter(
      (b) => b.assigned_inspection_staff_id === currentUserId,
    )
    const claimedByOther = allBookings.filter(
      (b) =>
        Boolean(b.assigned_inspection_staff_id) &&
        b.assigned_inspection_staff_id !== currentUserId,
    )
    const incidentHold = allBookings.filter(
      (b) => b.raw?.blocked_by_incident === true,
    )
    return {
      total: allBookings.length,
      claimable: claimable.length,
      mine: claimedByMe.length,
      others: claimedByOther.length,
      incident: incidentHold.length,
    }
  }, [allBookings, currentUserId])

  const totalPages = Math.max(1, Math.ceil(visibleBookings.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = visibleBookings.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  const handleConfirmClaim = async () => {
    if (!claimBooking) return
    try {
      await claimInspection.mutateAsync(claimBooking.id)
      // Refetch workspace + admin bookings cũ để InspectionPage (đọc từ
      // BookingContext) thấy booking assigned cho currentUser.
      await queryClient.refetchQueries({
        queryKey: workspaceQueryKeys.bookings(),
      })
      if (garageId) {
        await queryClient.refetchQueries({
          queryKey: staffQueryKeys.bookings(garageId),
        })
        await queryClient.refetchQueries({
          queryKey: ['staff', 'bookings', garageId, 'list'],
        })
      }
      showToast('Đã nhận kiểm tra booking thành công.', 'success')
      setClaimBooking(null)
      navigate(`/service/inspection?bookingId=${claimBooking.id}`)
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        'Không thể nhận kiểm tra booking này.',
      )
      showToast(message, 'error')
      void refetch()
    }
  }

  const hasFilter = Boolean(date) || Boolean(search)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/dashboard" className="hover:text-slate-900">
          Vận hành
        </Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-slate-900">
          Hàng chờ nhận kiểm tra
        </span>
      </nav>

      {isLoading ? (
        <>
          <PageHeaderSkeleton />
          <TableRowsSkeleton rows={6} columns={6} />
        </>
      ) : (
        <>
          {/* Page header */}
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900">
                Hàng chờ nhận kiểm tra
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Các booking đã check-in tại garage của bạn, sẵn sàng để nhận
                kiểm tra xe. Dữ liệu tự cập nhật mỗi 15 giây.
                {isFetching ? ' · đang đồng bộ...' : ''}
              </p>
            </div>
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
          </header>

          {/* Stats */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Có thể nhận"
              value={stats.claimable}
              accent="bg-emerald-100 text-emerald-700"
              hint="BE trả inspection.claim"
            />
            <StatCard
              label="Bạn đã nhận"
              value={stats.mine}
              accent="bg-brand-100 text-brand-800"
              hint="Đang phụ trách"
            />
            <StatCard
              label="Người khác nhận"
              value={stats.others}
              accent="bg-slate-100 text-slate-700"
              hint="Không thể nhận thêm"
            />
            <StatCard
              label="Tạm dừng sự cố"
              value={stats.incident}
              accent="bg-rose-100 text-rose-700"
              hint="Bị incident hold"
            />
          </section>

          {/* Filter row */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <Label htmlFor="queue-date">Ngày</Label>
                <Input
                  id="queue-date"
                  type="date"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="queue-search">Tìm kiếm</Label>
                <Input
                  id="queue-search"
                  type="search"
                  placeholder="Biển số, tên khách hoặc SĐT"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </div>
          </section>

          {isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {getApiErrorMessage(error, 'Không thể tải hàng chờ nhận kiểm tra.')}
            </div>
          ) : null}

          {/* Table */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Booking đang chờ kiểm tra
                </h2>
                <p className="text-xs text-slate-500">
                  {visibleBookings.length} kết quả
                  {hasFilter ? ' (đã lọc)' : ''}
                </p>
              </div>
            </div>

            <div className="p-0">
              {paginated.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title="Không có booking chờ nhận"
                  description="Hiện không có booking nào trong garage của bạn ở trạng thái CHECKED_IN."
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
                          <th className="px-4 py-3 text-right">Thành tiền</th>
                          <th className="px-4 py-3 text-right">Điểm</th>
                          <th className="px-4 py-3">Khung giờ</th>
                          <th className="px-4 py-3">Pha nghiệp vụ</th>
                          <th className="px-4 py-3">Trạng thái nhận</th>
                          <th className="px-4 py-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginated.map((booking, idx) => {
                          const canClaim = hasAvailableAction(
                            booking,
                            'inspection.claim',
                          )
                          const assigneeId =
                            booking.assigned_inspection_staff_id
                          const isMine =
                            Boolean(assigneeId) && assigneeId === currentUserId
                          const isOther =
                            Boolean(assigneeId) && assigneeId !== currentUserId
                          const incidentHold =
                            booking.raw?.blocked_by_incident === true

                          // Highlight row có thể nhận — dễ scan cho staff.
                          const rowClass = canClaim
                            ? idx % 2 === 1
                              ? 'bg-emerald-50/70 hover:bg-emerald-50'
                              : 'bg-emerald-50/40 hover:bg-emerald-50'
                            : idx % 2 === 1
                              ? 'bg-slate-50/50 hover:bg-slate-50'
                              : 'hover:bg-slate-50/60'

                          return (
                            <tr key={booking.id} className={rowClass}>
                              <td className="px-4 py-3">
                                <Link
                                  to={`/bookings/workspace/${booking.id}`}
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
                                    <p
                                      className="truncate text-sm font-semibold text-slate-900"
                                      title={getBookingDisplayName(booking).displayName}
                                    >
                                      {getBookingDisplayName(booking).displayName}
                                    </p>
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
                                  <CarFront className="mr-1 inline-block h-3.5 w-3.5 text-slate-400" />
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
                                <p
                                  className="max-w-[150px] truncate text-sm text-slate-900"
                                  title={booking.service_package_name || '—'}
                                >
                                  {booking.service_package_name || (
                                    <span className="font-normal italic text-slate-400">
                                      Chưa gán gói
                                    </span>
                                  )}
                                </p>
                                {!booking.is_walk_in ? (
                                  <p
                                    className="text-[11px] text-slate-500"
                                    title="Khách thân thiết trong hệ thống"
                                  >
                                    Khách thân thiết
                                  </p>
                                ) : booking.is_walk_in ? (
                                  <p
                                    className="text-[11px] text-slate-500"
                                    title="Khách vãng lai — không tích điểm"
                                  >
                                    Khách vãng lai
                                  </p>
                                ) : null}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <p className="text-sm font-medium text-slate-900">
                                  {booking.final_price > 0
                                    ? formatPrice(booking.final_price)
                                    : (
                                      <span className="font-normal italic text-slate-400">
                                        Chưa tính
                                      </span>
                                    )}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {booking.is_walk_in ? (
                                  <p
                                    className="text-sm font-medium text-slate-400"
                                    title="Khách vãng lai không tích điểm"
                                  >
                                    0
                                  </p>
                                ) : (booking.service_package_points_estimated ?? 0) >
                                  0 ? (
                                  <p
                                    className="text-sm font-semibold text-amber-600"
                                    title="Điểm ước tính sẽ cộng sau khi hoàn tất dịch vụ"
                                  >
                                    +{booking.service_package_points_estimated}
                                  </p>
                                ) : (
                                  <p
                                    className="text-sm font-medium text-slate-400"
                                    title="Gói dịch vụ không tích điểm"
                                  >
                                    —
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm font-semibold text-slate-900">
                                  {formatTime(booking.start_time)} –{' '}
                                  {formatTime(booking.end_time)}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center rounded-full bg-navy-100 px-2 py-0.5 text-[11px] font-medium text-navy-700">
                                  {booking.raw?.workflow_phase
                                    ? WORKFLOW_PHASE_LABELS[
                                        booking.raw
                                          .workflow_phase as keyof typeof WORKFLOW_PHASE_LABELS
                                      ] ?? booking.raw.workflow_phase
                                    : '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {isMine ? (
                                  <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">
                                    Bạn đã nhận
                                  </span>
                                ) : isOther ? (
                                  <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                                    Người khác
                                  </span>
                                ) : incidentHold ? (
                                  <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                                    Incident hold
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                    Chưa nhận
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {canClaim ? (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setClaimBooking(booking)}
                                  >
                                    <ScanSearch className="h-4 w-4" />
                                    Nhận kiểm tra
                                  </Button>
                                ) : isMine ? (
                                  <Link to={`/service/inspection?bookingId=${booking.id}`}>
                                    <Button variant="secondary" size="sm">
                                      Mở biên bản
                                    </Button>
                                  </Link>
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

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

interface StatCardProps {
  label: string
  value: number
  icon?: typeof CarFront
  accent: string
  hint?: string
}

function StatCard({ label, value, icon: Icon, accent, hint }: StatCardProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-900">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-[28px] font-bold leading-tight tracking-tight text-slate-900">
          {value}
        </p>
        {hint ? (
          <p className="mt-0.5 text-[11px] font-medium text-slate-400">{hint}</p>
        ) : null}
      </div>
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${accent}`}
      >
        {Icon ? <Icon className="h-6 w-6" /> : null}
      </span>
    </div>
  )
}
