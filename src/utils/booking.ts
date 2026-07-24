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

/**
 * Heuristic phát hiện booking walk-in khi BE list không trả `is_walk_in`.
 *
 * BE staff workspace list endpoint (GET /staff/workspace/bookings) hiện chỉ
 * trả customer_name/customer_phone (đã populate từ User nếu booking không phải
 * walk-in, hoặc từ guest_* nếu walk-in) mà KHÔNG trả `is_walk_in`.
 * Tạm thời suy ra: cả tên lẫn SĐT đều rỗng → nhiều khả năng là walk-in mà
 * nhân viên không nhập guest_name/guest_phone.
 *
 * Khi BE bổ sung `is_walk_in` (hoặc `guest_name`/`guest_phone` raw) vào list
 * response thì helper này có thể được thay bằng check trực tiếp.
 */
export function isLikelyWalkIn(booking: Booking): boolean {
  if (booking.is_walk_in) return true
  return !booking.customer_name && !booking.customer_phone
}

/**
 * Trả tên hiển thị + cờ walk-in cho UI:
 *  - Có tên khách → tên khách (kèm tag Walk-in nếu BE là walk-in)
 *  - Có SĐT nhưng không tên → "Khách lẻ" + 4 số cuối SĐT (hoặc "Khách #xxxx" nếu
 *    không có SĐT). Phân biệt được với "Khách vãng lai" thực sự (không có info).
 *  - Cả hai rỗng → "Khách vãng lai" (BE không populate được customer)
 */
export function getBookingDisplayName(
  booking: Booking,
): { displayName: string; isWalkIn: boolean; hasPhone: boolean } {
  const name = getBookingCustomerName(booking)
  const phone = getBookingPhone(booking)
  const likelyWalkIn = isLikelyWalkIn(booking)

  if (name && name !== 'Khách hàng') {
    return { displayName: name, isWalkIn: likelyWalkIn, hasPhone: Boolean(phone) }
  }

  if (phone) {
    const tail = phone.replace(/\D/g, '').slice(-4)
    return {
      displayName: tail ? `Khách lẻ ···${tail}` : `Khách #${booking.id.slice(0, 6)}`,
      isWalkIn: likelyWalkIn,
      hasPhone: true,
    }
  }

  return { displayName: 'Khách vãng lai', isWalkIn: true, hasPhone: false }
}

export function normalizeSearchText(value: string) {
  return value.replace(/[\s.-]/g, '').toLowerCase()
}

/**
 * Lấy 2 chữ cái đầu để làm avatar fallback.
 *  - Có tên thật → 2 chữ cái đầu của từng từ (vd "Nguyễn Văn A" → "NA").
 *  - Có SĐT → 2 số cuối.
 *  - Có ID booking → 2 ký tự đầu id (vd "WA" cho walk-in).
 *  - Cuối cùng fallback "KH".
 */
export function getBookingInitials(booking: Booking): string {
  const displayName = getBookingCustomerName(booking)
  if (displayName && displayName !== 'Khách hàng') {
    return displayName
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const phone = getBookingPhone(booking)
  if (phone) {
    return phone.replace(/\D/g, '').slice(-2) || 'KH'
  }

  return booking.id ? booking.id.slice(0, 2).toUpperCase() : 'KH'
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
