import type { Booking } from '../../../types/booking'
import { getAdminGarageName } from '../../../mocks/admin'
import { getAdminServicePackageName } from '../../../mocks/admin'
import { getAdminBookingCustomerName } from '../../../utils/adminBooking'
import { formatDateTime, formatPrice } from '../../../utils/format'

/**
 * Convert danh sách booking có payment ra CSV và trigger download.
 * Đặt ở trang admin payments để không phụ thuộc vào hook.
 */
export function exportBookingsToCsv(bookings: Booking[]): void {
  if (bookings.length === 0) return

  const headers = [
    'Mã booking',
    'Chi nhánh',
    'Khách hàng',
    'SĐT',
    'Biển số',
    'Gói dịch vụ',
    'Giờ hẹn',
    'Số tiền',
    'PTTT',
    'Trạng thái TT',
    'Trạng thái booking',
    'Cập nhật',
  ]

  const escape = (value: string | number | null | undefined) => {
    const str = value == null ? '' : String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const rows = bookings.map((booking) => [
    booking.id.replace('booking-', 'BK-'),
    getAdminGarageName(booking.garage_id),
    getAdminBookingCustomerName(booking),
    booking.customer_phone ?? booking.guest_phone ?? '',
    booking.license_plate ?? '',
    getAdminServicePackageName(booking.service_package_id),
    formatDateTime(booking.start_time),
    formatPrice(booking.final_price),
    booking.payment_method,
    booking.payment_status,
    booking.status,
    formatDateTime(booking.start_time),
  ])

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
  link.download = `carivo_payments_${today}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
