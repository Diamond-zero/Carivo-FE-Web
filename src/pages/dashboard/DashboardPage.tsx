import { createColumnHelper } from '@tanstack/react-table'
import {
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  Wrench,
} from 'lucide-react'
import { useMemo } from 'react'
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
import { WashBayStatusGrid } from '../../components/wash-bay/WashBayStatusGrid'
import { useAuth } from '../../contexts/AuthContext'
import { useBookings } from '../../contexts/BookingContext'
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
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Đang chờ check-in',
      value: stats.waitingCheckIn,
      icon: ClipboardList,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      label: 'Đang thực hiện',
      value: stats.inProgress,
      icon: Wrench,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Hoàn thành chờ thanh toán',
      value: stats.completedUnpaid,
      icon: CircleDollarSign,
      color: 'text-emerald-600 bg-emerald-50',
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
      <PageHeader
        title="Dashboard"
        description={`Tổng quan garage ${session?.garage.name ?? ''} — ${MOCK_TODAY.split('-').reverse().join('/')}`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {stat.value}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
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
            emptyMessage="Không có booking sắp tới hôm nay"
          />
        </CardContent>
      </Card>
    </div>
  )
}
