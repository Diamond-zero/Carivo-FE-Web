import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { mockBookings } from '../../mocks/bookings'
import type { Booking } from '../../types/booking'

const columnHelper = createColumnHelper<Booking>()

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value)
}

export function DashboardPage() {
  const recentBookings = useMemo(() => mockBookings.slice(0, 5), [])

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

  const stats = [
    { label: 'Booking hôm nay', value: '8' },
    { label: 'Chờ check-in', value: '2' },
    { label: 'Đang thực hiện', value: '1' },
    { label: 'Chờ thanh toán', value: '1' },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Tổng quan hoạt động garage hôm nay — dữ liệu mock."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking sắp tới</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <DataTable columns={columns} data={recentBookings} />
        </CardContent>
      </Card>
    </div>
  )
}
