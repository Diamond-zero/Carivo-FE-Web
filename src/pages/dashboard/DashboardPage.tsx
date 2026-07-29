import {
  CalendarClock,
  CarFront,
  CircleDollarSign,
  ClipboardList,
  Plus,
  TimerReset,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../api/client'
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { useAuth } from '../../contexts/AuthContext'
import { useBookings } from '../../contexts/BookingContext'
import { useCanStaffCapability } from '../../hooks/api/staff/useStaffCapabilities'
import { useStaffDashboardOverview } from '../../hooks/api/staff/useStaffDashboard'
import { useInitialPageSkeleton } from '../../hooks/useInitialPageSkeleton'
import { cn } from '../../lib/utils'
import type { Booking } from '../../types/booking'
import type { WashBay } from '../../types/washBay'
import { getUpcomingBookings } from '../../utils/dashboard'
import { formatPrice, formatTime, getTodayDateString } from '../../utils/format'
import { getBookingCustomerName } from '../../utils/booking'

interface DashboardAction {
  label: string
  description: string
  cta: string
  to: string
  icon: LucideIcon
  tone: 'dark' | 'light'
}

const DASHBOARD_TITLES: Record<string, string> = {
  CUSTOMER_SERVICE_STAFF: 'Dashboard điều phối',
  VEHICLE_INSPECTION_STAFF: 'Dashboard kiểm tra xe',
  WASH_OPERATOR: 'Dashboard vận hành rửa',
  VEHICLE_CARE_STAFF: 'Dashboard chăm sóc xe',
}

function deriveProgress(
  booking: Booking | undefined,
): number {
  if (!booking) return 0
  const start = new Date(booking.start_time).getTime()
  const end = new Date(booking.end_time).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0
  const now = Date.now()
  if (now <= start) return 5
  if (now >= end) return 100
  return Math.round(((now - start) / (end - start)) * 100)
}

function bayAccent(bay: WashBay) {
  switch (bay.status) {
    case 'OCCUPIED':
      return { ring: 'border-brand-300', bar: 'bg-brand-500', chip: 'bg-brand-100 text-brand-800' }
    case 'AVAILABLE':
      return { ring: 'border-emerald-200', bar: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-800' }
    case 'MAINTENANCE':
      return { ring: 'border-amber-200', bar: 'bg-amber-500', chip: 'bg-amber-100 text-amber-800' }
    case 'INACTIVE':
      return { ring: 'border-slate-200', bar: 'bg-slate-400', chip: 'bg-slate-100 text-slate-700' }
    default:
      return { ring: 'border-slate-200', bar: 'bg-slate-400', chip: 'bg-slate-100 text-slate-700' }
  }
}

export function DashboardPage() {
  const { session } = useAuth()
  const {
    bookings,
    isLoading: isLoadingBookings,
    washBays,
    isLoadingWashBays,
    isWashBaysError,
    washBaysError,
  } = useBookings()
  const initialLoading = useInitialPageSkeleton()
  const {
    capabilities,
    isLoading: isLoadingCapabilities,
  } = useCanStaffCapability()
  const dashboardQuery = useStaffDashboardOverview()
  const overview = dashboardQuery.data
  const canReadGarage = capabilities.includes('booking.read_garage')
  const canAssignWashBay = capabilities.includes('booking.wash_bay.assign')
  const canReadRevenue = capabilities.includes('payment.manage_garage')
  const upcomingBookings = useMemo(
    () => getUpcomingBookings(bookings, 6),
    [bookings],
  )

  const washBayCards = useMemo(() => {
    return washBays.slice(0, 4).map((bay) => {
      const occupiedBooking = bay.current_booking_id
        ? bookings.find((booking) => booking.id === bay.current_booking_id)
        : undefined
      return {
        bay,
        occupiedBooking,
        progress: deriveProgress(occupiedBooking),
        accent: bayAccent(bay),
      }
    })
  }, [washBays, bookings])

  if (
    initialLoading ||
    isLoadingBookings ||
    isLoadingWashBays ||
    isLoadingCapabilities ||
    dashboardQuery.isLoading
  ) {
    return <DashboardPageSkeleton />
  }

  const todayLabel = getTodayDateString().split('-').reverse().join('/')
  const garageLabel = session?.garage?.name ?? ''
  const dashboardTitle =
    DASHBOARD_TITLES[session?.staffProfile.staff_type ?? ''] ??
    'Dashboard vận hành'
  const hasOverview = Boolean(overview)
  const quickActions: DashboardAction[] = []

  if (capabilities.includes('booking.check_in')) {
    quickActions.push({
      label: 'Check-in nhanh',
      description:
        'Quét QR hoặc nhập biển số để bắt đầu phiên dịch vụ đã đặt trước.',
      cta: 'Bắt đầu check-in',
      to: '/bookings/check-in',
      icon: CarFront,
      tone: 'dark',
    })
  }

  if (capabilities.includes('booking.walk_in.create')) {
    quickActions.push({
      label: 'Khách vãng lai',
      description:
        'Đăng ký cho khách không có lịch hẹn trước và điều phối vào khoang trống.',
      cta: 'Đăng ký vãng lai',
      to: '/bookings/walk-in',
      icon: Plus,
      tone: 'light',
    })
  }

  if (capabilities.includes('inspection.claim_garage')) {
    quickActions.push({
      label: 'Hàng chờ kiểm tra xe',
      description:
        'Xem booking đang chờ kiểm tra và nhận công việc phù hợp trong garage.',
      cta: 'Mở hàng chờ kiểm tra',
      to: '/staff/inspection-queue',
      icon: ClipboardList,
      tone: 'dark',
    })
  }

  if (
    capabilities.includes('service_task.wash.execute_assigned') ||
    capabilities.includes('service_task.care.execute_assigned') ||
    capabilities.includes('booking.service.read_garage')
  ) {
    quickActions.push({
      label: 'Thực hiện dịch vụ',
      description:
        'Mở danh sách công việc và thực hiện các bước được phân công.',
      cta: 'Mở màn thực hiện',
      to: '/service/execution',
      icon: Wrench,
      tone: 'dark',
    })
  }

  if (capabilities.includes('booking.workflow.read_garage')) {
    quickActions.push({
      label: 'Workspace booking',
      description:
        'Theo dõi trạng thái nghiệp vụ và công việc trong garage.',
      cta: 'Xem danh sách booking',
      to: '/bookings',
      icon: CalendarClock,
      tone: 'light',
    })
  }

  const headerActions = quickActions.slice(0, 2)
  const dashboardErrors = [
    dashboardQuery.isError
      ? getApiErrorMessage(
          dashboardQuery.error,
          'Không thể tải thống kê dashboard.',
        )
      : null,
    washBaysError,
  ].filter((message): message is string => Boolean(message))

  const statCards = [
    {
      label: 'Booking hôm nay',
      value: hasOverview ? overview?.total_bookings ?? 0 : '—',
      icon: CalendarClock,
      hint: 'Tổng lịch hẹn tại garage trong ngày',
    },
    {
      label: 'Xe đang rửa',
      value: isWashBaysError
        ? '—'
        : washBays.filter((bay) => bay.status === 'OCCUPIED').length,
      icon: Wrench,
      hint: 'Theo trạng thái buồng rửa thực tế',
    },
    canReadRevenue
      ? {
          label: 'Doanh thu hôm nay',
          value: hasOverview ? formatPrice(overview?.total_revenue ?? 0) : '—',
          icon: CircleDollarSign,
          hint: 'Theo giao dịch đã thanh toán trong ngày',
        }
      : {
          label: 'Đã hoàn thành',
          value: hasOverview ? overview?.completed_bookings ?? 0 : '—',
          icon: ClipboardList,
          hint: 'Booking hoàn thành tại garage trong ngày',
        },
    {
      label: 'Tỷ lệ hoàn thành',
      value: hasOverview
        ? `${Math.round(overview?.completion_rate ?? 0)}%`
        : '—',
      icon: TimerReset,
      hint: 'Hoàn thành / tổng booking hôm nay',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
            Bảng điều khiển
          </p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight text-slate-900">
            {dashboardTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Garage {garageLabel} · {todayLabel}
          </p>
        </div>
        {headerActions.length > 0 ? (
          <div className="flex items-center gap-2">
            {headerActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all active:scale-95',
                    action.tone === 'dark'
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </Link>
              )
            })}
          </div>
        ) : null}
      </header>

      {dashboardErrors.length > 0 ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {dashboardErrors.join(' ')}
        </div>
      ) : null}

      {/* 1. Stats Row */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {stat.label}
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <p className="text-[28px] font-bold leading-tight tracking-tight text-slate-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
              </div>
            </div>
          )
        })}
      </section>

      {/* 2. Wash Bay Bento Grid */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-slate-900">
              Trạng thái buồng rửa
            </h2>
            <p className="text-xs text-slate-500">
              {washBays.length} buồng tại garage — đồng bộ từ cấu hình BE
            </p>
          </div>
          <Link
            to="/bookings"
            className="text-xs font-semibold text-brand-700 hover:underline"
          >
            Xem tất cả →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {!isWashBaysError && washBayCards.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Chưa có buồng rửa nào được cấu hình.
            </div>
          ) : null}
          {washBayCards.map(({ bay, occupiedBooking, progress, accent }) => {
            const isOccupied = bay.status === 'OCCUPIED'
            const isAvailable = bay.status === 'AVAILABLE'
            const isMaintenance = bay.status === 'MAINTENANCE'
            return (
              <div
                key={bay.id}
                className={cn(
                  'relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-colors hover:border-slate-900',
                  accent.ring,
                )}
              >
                {isOccupied ? (
                  <span className="absolute right-2 top-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-800">
                    Đang làm
                  </span>
                ) : null}

                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                    <CarFront className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold text-slate-900">
                      {bay.name}
                    </h3>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {bay.bay_code}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {isOccupied ? (
                    occupiedBooking ? (
                      <>
                        <div className="flex items-end justify-between">
                          <span className="text-[14px] font-bold tracking-tight text-slate-900">
                            {occupiedBooking.license_plate}
                          </span>
                          <span className="text-sm font-bold text-brand-700">
                            {progress}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn('h-full rounded-full', accent.bar)}
                            style={{ width: `${Math.max(8, progress)}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-2 border-t border-slate-100 pt-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-800">
                            {getBookingCustomerName(occupiedBooking)
                              .split(' ')
                              .map((part) => part.charAt(0))
                              .slice(0, 2)
                              .join('')
                              .toUpperCase() || 'KH'}
                          </span>
                          <span className="truncate text-xs font-medium text-slate-600">
                            {getBookingCustomerName(occupiedBooking)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-lg bg-brand-50 px-3 py-4 text-center">
                        <p className="text-xs font-semibold text-brand-800">
                          Buồng đang được sử dụng
                        </p>
                        <p className="mt-1 text-[11px] text-brand-700">
                          Booking ngoài phạm vi được giao
                        </p>
                      </div>
                    )
                  ) : isAvailable ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50/60 py-6 text-center">
                      <Wrench className="h-5 w-5 text-emerald-700" />
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        Sẵn sàng
                      </p>
                      <Link
                        to="/bookings"
                        className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:scale-105 active:scale-95"
                      >
                        {canAssignWashBay ? 'Điều phối ngay' : 'Xem công việc'}
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <span className="font-semibold uppercase tracking-wider text-slate-500">
                        {isMaintenance ? 'Bảo trì' : 'Ngưng hoạt động'}
                      </span>
                      <span>{bay.bay_code}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3. Queue + Quick Actions */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Hàng đợi chờ */}
        <div className="space-y-3 lg:col-span-1">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight text-slate-900">
                {canReadGarage ? 'Hàng đợi chờ' : 'Công việc của tôi'}
              </h2>
              <p className="text-xs text-slate-500">
                {upcomingBookings.length} booking đang hoạt động
              </p>
            </div>
            <Link
              to="/bookings"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
            >
              Xem tất cả
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {upcomingBookings.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <ClipboardList className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Không có hàng chờ
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Hôm nay chưa có booking cần xử lý thêm.
                </p>
              </div>
            ) : (
              <div className="max-h-[440px] divide-y divide-slate-100 overflow-y-auto">
                {upcomingBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    to={
                      canReadGarage
                        ? `/bookings/${booking.id}`
                        : `/bookings/workspace/${booking.id}`
                    }
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      {booking.vehicle_type === 'CAR' ? 'ÔTÔ' : 'XEMÁY'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {booking.license_plate}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {booking.service_package_name ?? 'Dịch vụ'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-medium text-slate-500">
                        {formatTime(booking.start_time)}
                      </p>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions + Lưu ý */}
        <div className="space-y-3 lg:col-span-2">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-slate-900">
              Thao tác nhanh
            </h2>
            <p className="text-xs text-slate-500">
              Truy cập nhanh các chức năng hay dùng
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-900"
                >
                  <span
                    className={cn(
                      'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
                      action.tone === 'dark'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-900',
                    )}
                  >
                    <Icon className="h-7 w-7" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900">
                      {action.label}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {action.description}
                    </p>
                    <span className="mt-3 inline-block text-xs font-semibold text-brand-700 group-hover:underline">
                      {action.cta} →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
