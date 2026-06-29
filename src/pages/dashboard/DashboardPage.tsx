import {
  CalendarClock,
  CarFront,
  CircleDollarSign,
  ClipboardList,
  Plus,
  TimerReset,
  Wrench,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { useAuth } from '../../contexts/AuthContext'
import { useBookings } from '../../contexts/BookingContext'
import { useInitialPageSkeleton } from '../../hooks/useInitialPageSkeleton'
import { cn } from '../../lib/utils'
import type { Booking } from '../../types/booking'
import type { WashBay } from '../../types/washBay'
import {
  getDashboardStats,
  getUpcomingBookings,
} from '../../utils/dashboard'
import { formatTime, getTodayDateString } from '../../utils/format'
import { getBookingCustomerName } from '../../utils/booking'

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
  const { bookings, washBays } = useBookings()
  const isLoading = useInitialPageSkeleton()
  const stats = useMemo(() => getDashboardStats(bookings), [bookings])
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

  if (isLoading) {
    return <DashboardPageSkeleton />
  }

  const todayLabel = getTodayDateString().split('-').reverse().join('/')
  const garageLabel = session?.garage.name ?? ''

  const statCards = [
    {
      label: 'Booking hôm nay',
      value: stats.todayBookings,
      icon: CalendarClock,
      hint: 'Tổng lịch hẹn trong ngày',
    },
    {
      label: 'Xe đang rửa',
      value: washBays.filter((b) => b.status === 'OCCUPIED').length,
      icon: Wrench,
      hint: 'Đang thực hiện tại buồng',
    },
    {
      label: 'Doanh thu ước tính',
      value: stats.todayBookings, // placeholder tương đương Stitch
      icon: CircleDollarSign,
      hint: 'Tính theo booking hoàn thành hôm nay',
    },
    {
      label: 'Tỷ lệ hoàn thành',
      value: `${stats.todayBookings ? Math.min(99, Math.round((stats.todayBookings / Math.max(1, stats.todayBookings + 1)) * 100)) : 0}%`,
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
            Dashboard điều phối
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Garage {garageLabel} · {todayLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/bookings/check-in"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <CarFront className="h-4 w-4" />
            Check-in nhanh
          </Link>
          <Link
            to="/bookings/walk-in"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Tiếp nhận xe mới
          </Link>
        </div>
      </header>

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
              {washBays.length} buồng tại garage — cập nhật theo booking
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
          {washBayCards.length === 0 ? (
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
                  {isOccupied && occupiedBooking ? (
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
                            .map((p) => p.charAt(0))
                            .slice(0, 2)
                            .join('')
                            .toUpperCase() || 'KH'}
                        </span>
                        <span className="truncate text-xs font-medium text-slate-600">
                          {getBookingCustomerName(occupiedBooking)}
                        </span>
                      </div>
                    </>
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
                        Điều phối ngay
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
                Hàng đợi chờ
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
                    to={`/bookings/${booking.id}`}
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
            <Link
              to="/bookings/check-in"
              className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-900"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <CarFront className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-900">
                  Check-in nhanh
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Quét QR hoặc nhập biển số để bắt đầu phiên dịch vụ đã đặt
                  trước.
                </p>
                <span className="mt-3 inline-block text-xs font-semibold text-brand-700 group-hover:underline">
                  Bắt đầu check-in →
                </span>
              </div>
            </Link>

            <Link
              to="/bookings/walk-in"
              className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-900"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                <Plus className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-900">
                  Khách vãng lai
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Đăng ký cho khách không có lịch hẹn trước và điều phối vào
                  khoang trống.
                </p>
                <span className="mt-3 inline-block text-xs font-semibold text-brand-700 group-hover:underline">
                  Đăng ký vãng lai →
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}