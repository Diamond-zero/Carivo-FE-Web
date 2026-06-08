import type { Booking, BookingStatus } from '../types/booking'

export interface TimelineStage {
  key: string
  label: string
}

export type TimelineItemState = 'completed' | 'current' | 'upcoming' | 'canceled'

export const BOOKING_TIMELINE_STAGES: TimelineStage[] = [
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'CHECKED_IN', label: 'Check-in' },
  { key: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
  { key: 'PAID', label: 'Đã thanh toán' },
]

const STATUS_ORDER: Record<BookingStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  CHECKED_IN: 2,
  IN_PROGRESS: 3,
  COMPLETED: 4,
  CANCELED: -1,
  NO_SHOW: -1,
}

function getEffectiveOrder(booking: Booking) {
  if (booking.status === 'CANCELED' || booking.status === 'NO_SHOW') {
    return STATUS_ORDER[booking.status]
  }

  if (booking.status === 'COMPLETED' && booking.payment_status === 'PAID') {
    return 5
  }

  return STATUS_ORDER[booking.status]
}

function getStageOrder(stageKey: string) {
  if (stageKey === 'PAID') return 5
  return STATUS_ORDER[stageKey as BookingStatus] ?? 0
}

export function getTimelineItemState(
  booking: Booking,
  stageKey: string,
): TimelineItemState {
  if (booking.status === 'CANCELED' || booking.status === 'NO_SHOW') {
    return 'canceled'
  }

  const currentOrder = getEffectiveOrder(booking)
  const stageOrder = getStageOrder(stageKey)

  if (stageKey === 'PAID') {
    if (booking.payment_status === 'PAID') return 'completed'
    if (booking.status === 'COMPLETED') return 'current'
    return 'upcoming'
  }

  if (stageOrder < currentOrder) return 'completed'
  if (stageOrder === currentOrder) return 'current'
  return 'upcoming'
}
