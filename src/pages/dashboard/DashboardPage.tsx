import { createColumnHelper } from '@tanstack/react-table'
import {
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  Inbox,
  Wrench,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { StatCard } from '../../components/ui/StatCard'
import { Button } from '../../components/ui/Button'
import { WashBayStatusGrid } from '../../components/wash-bay/WashBayStatusGrid'
import { useAuth } from '../../contexts/AuthContext'
import { useBookings } from '../../contexts/BookingContext'
import { useInitialPageSkeleton } from '../../hooks/useInitialPageSkeleton'
import type { Booking } from '../../types/booking'
import { getBookingCustomerName } from '../../utils/booking'
import {
  getDashboardStats,
  getUpcomingBookings,
} from '../../utils/dashboard'
import { formatPrice, formatTime, MOCK_TODAY } from '../../utils/format'

const columnHelper = createColumnHelper<Booking>()

export function DashboardPage() {
  const { session } = useAuth()
  const { bookings, washBays } = useBookings()
  const isLoading = useInitialPageSkeleton()
  const stats = useMemo(() => getDashboardStats(bookings), [bookings])
  const upcomingBookings = useMemo(
    () => getUpcomingBookings(bookings, 5),
    [bookings],
  )

  const statCards = [
    {
      label: 'Booking hôm nay',
      value: stats.todayBookings,
      icon: CalendarClock,
      accent: 'brand' as const,
    },
    {
      label: 'Đang chờ check-in',
      value: stats.waitingCheckIn,
      icon: ClipboardList,
      accent: 'indigo' as const,
    },
    {
      label: 'Đang thực hiện',
      value: stats.inProgress,
      icon: Wrench,
      accent: 'amber' as const,
    },
    {
      label: 'Hoàn thành chờ thanh toán',
      value: stats.completedUnpaid,
      icon: CircleDollarSign,
      accent: 'emerald' as const,
    },
  ]

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Mã',
        cell: (info) => (
          <span className="font-medium text-slate-900">
            {info.getValue().replace('booking-', '#')}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'customer',
        header: 'Khách',
        cell: ({ row }) => getBookingCustomerName(row.original),
      }),
      columnHelper.accessor('license_plate', {
        header: 'Biển số',
      }),
      columnHelper.accessor('start_time', {
        header: 'Giờ hẹn',
        cell: (info) => formatTime(info.getValue()),
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        cell: (info) => <BookingStatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor('final_price', {
        header: 'Giá',
        cell: (info) => formatPrice(info.getValue()),
      }),
    ],
    [],
  )

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
      <PageHeader
        title="Dashboard"
        description={`Tổng quan garage ${session?.garage.name ?? ''} — ${MOCK_TODAY.split('-').reverse().join('/')}`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            accent={stat.accent}
          />
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Trạng thái buồng rửa</CardTitle>
          <CardDescription>
            Theo dõi realtime {washBays.length} buồng rửa tại garage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WashBayStatusGrid washBays={washBays} bookings={bookings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking sắp tới</CardTitle>
          <CardDescription>
            {upcomingBookings.length} booking gần nhất cần xử lý hôm nay
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <DataTable
            columns={columns}
            data={upcomingBookings}
            emptyState={{
              icon: Inbox,
              title: 'Không có booking sắp tới',
              description: 'Hôm nay chưa có lịch hẹn cần xử lý thêm tại garage.',
              action: (
                <Link to="/bookings">
                  <Button variant="secondary" size="sm">
                    Xem tất cả booking
                  </Button>
                </Link>
              ),
            }}
          />
        </CardContent>
      </Card>
        </>
      )}
    </div>
  )
}
