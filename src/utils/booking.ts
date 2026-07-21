import type { Booking } from '../types/booking'

export function getBookingCustomerName(booking: Booking) {
  if (booking.customer_name) {
    return booking.customer_name
  }

  if (booking.is_walk_in && booking.guest_name) {
    return booking.guest_name
  }

  return 'Khách hàng'
}

export function getBookingPhone(booking: Booking) {
  if (booking.customer_phone) {
    return booking.customer_phone
  }

  if (booking.guest_phone) {
    return booking.guest_phone
  }

  return ''
}

export function normalizeSearchText(value: string) {
  return value.replace(/[\s.\-]/g, '').toLowerCase()
}

/**
 * BE trả ISO date/time có thể kèm 'Z' hoặc offset. Chuyển sang dạng hiển thị
 * dd/MM/yyyy HH:mm theo local time (theo giờ VN — Intl đã làm việc này).
 */
export function formatBookingLocalTime(
  isoString?: string | null,
  fallback = '—',
): string {
  if (!isoString) return fallback
  try {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return fallback
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  } catch {
    return fallback
  }
}

/**
 * Format ISO → input[type="datetime-local"] value (YYYY-MM-DDTHH:mm).
 */
export function toDateTimeLocalInputValue(isoString?: string | null): string {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
    ].join('-')
      + 'T'
      + [pad(date.getHours()), pad(date.getMinutes())].join(':')
  } catch {
    return ''
  }
}

export interface BookingAction {
  label: string
  to: string
}

export {
  getBookingAction,
  getBookingListAction,
  type BookingListAction,
} from './bookingActionGuards'
