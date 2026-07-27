import type { Booking } from '../types/booking'
import { getAdminGarageName } from '../mocks/admin'
import { getAdminServicePackageName } from '../mocks/admin'
import { getAdminBookingCustomerName } from './adminBooking'
import { formatPrice } from './format'

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const escape = (value: string | number | null | undefined) => {
    const str = value == null ? '' : String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csv = [headers, ...rows]
    .map((row) => row.map(escape).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const today = new Date().toISOString().split('T')[0]
  link.href = url
  link.download = `${filename}_${today}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportBookingsToCsv(bookings: Booking[]): void {
  if (bookings.length === 0) return

  const headers = [
    'Mã booking',
    'Chi nhánh',
    'Khách hàng',
    'SĐT',
    'Biển số',
    'Loại xe',
    'Gói dịch vụ',
    'Giờ hẹn',
    'Ngày',
    'Số tiền gốc',
    'Giảm giá',
    'Thành tiền',
    'PTTT',
    'Trạng thái TT',
    'Trạng thái',
    'Vãng lai',
    'Ghi chú',
  ]

  const rows = bookings.map((booking) => [
    booking.id.replace('booking-', 'BK-'),
    getAdminGarageName(booking.garage_id),
    getAdminBookingCustomerName(booking),
    booking.customer_phone ?? booking.guest_phone ?? '',
    booking.license_plate ?? '',
    booking.vehicle_type,
    getAdminServicePackageName(booking.service_package_id),
    booking.start_time,
    booking.booking_date,
    booking.original_price,
    booking.discount_amount,
    formatPrice(booking.final_price),
    booking.payment_method,
    booking.payment_status,
    booking.status,
    booking.is_walk_in ? 'Có' : 'Không',
    booking.note ?? '',
  ])

  downloadCsv('carivo_bookings', headers, rows)
}
