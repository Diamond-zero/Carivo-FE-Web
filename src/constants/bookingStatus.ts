import type { BookingStatus } from '../types/booking'

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã check-in',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELED: 'Đã hủy',
  NO_SHOW: 'Không đến',
}

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-700',
  CONFIRMED: 'bg-brand-100 text-brand-800',
  CHECKED_IN: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-orange-100 text-orange-700',
}
