import {
  Banknote,
  Check,
  CheckCheck,
  Circle,
  Clock,
  Flag,
  Hourglass,
  type LucideIcon,
  X,
} from 'lucide-react'
import type { Booking } from '../../types/booking'
import {
  BOOKING_TIMELINE_STAGES,
  getTimelineItemState,
} from '../../utils/bookingTimeline'
import { cn } from '../../lib/utils'

interface BookingTimelineProps {
  booking: Booking
  className?: string
  /**
   * `responsive` (mặc định): stack dọc trên mobile, ngang trên ≥md.
   * `vertical`: luôn stack dọc — dùng cho cột hẹp (booking detail card).
   */
  orientation?: 'responsive' | 'vertical'
}

const stateStyles = {
  completed: {
    dot: 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 ring-4 ring-emerald-100',
    line: 'bg-gradient-to-b from-emerald-400 to-emerald-300',
    label: 'text-emerald-800',
    badge:
      'inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100',
    BadgeIcon: Check as LucideIcon,
    badgeText: 'Hoàn thành',
  },
  current: {
    dot: 'bg-white text-indigo-600 ring-4 ring-indigo-100 shadow-sm shadow-indigo-500/20 animate-[carivo-pulse-soft_2.4s_ease-in-out_infinite]',
    line: 'bg-slate-200',
    label: 'text-indigo-800',
    badge:
      'inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 ring-1 ring-indigo-100',
    BadgeIcon: Hourglass as LucideIcon,
    badgeText: 'Đang diễn ra',
  },
  upcoming: {
    dot: 'bg-slate-50 text-slate-300 ring-1 ring-slate-200',
    line: 'bg-slate-200',
    label: 'text-slate-400',
    badge:
      'inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200',
    BadgeIcon: Circle as LucideIcon,
    badgeText: 'Sắp tới',
  },
  canceled: {
    dot: 'bg-red-50 text-red-400 ring-1 ring-red-200',
    line: 'bg-slate-200',
    label: 'text-slate-400 line-through decoration-slate-300',
    badge:
      'inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600 ring-1 ring-red-100',
    BadgeIcon: X as LucideIcon,
    badgeText: 'Đã huỷ',
  },
}

const stageIcon: Record<string, LucideIcon> = {
  CONFIRMED: CheckCheck,
  CHECKED_IN: Check,
  IN_PROGRESS: Clock,
  COMPLETED: Flag,
  PAID: Banknote,
}

export function BookingTimeline({
  booking,
  className,
  orientation = 'responsive',
}: BookingTimelineProps) {
  const isCanceled =
    booking.status === 'CANCELED' || booking.status === 'NO_SHOW'
  const isVertical = orientation === 'vertical'

  return (
    <div className={cn('w-full', className)}>
      <div
        role="list"
        aria-label="Tiến trình xử lý booking"
        className={cn(
          // Mobile-first: vertical column. md trở lên → ngang trong responsive.
          'flex flex-col gap-0',
          !isVertical && 'md:flex-row md:items-stretch md:justify-between',
        )}
      >
        {BOOKING_TIMELINE_STAGES.map((stage, index) => {
          const state = getTimelineItemState(booking, stage.key)
          const styles = stateStyles[state]
          const isLast = index === BOOKING_TIMELINE_STAGES.length - 1
          const StageIcon = stageIcon[stage.key] ?? Circle
          const BadgeIcon = styles.BadgeIcon

          // Stagger animation delay: mỗi bước cách 90ms
          const delayMs = index * 90

          return (
            <div
              key={stage.key}
              role="listitem"
              aria-current={state === 'current' ? 'step' : undefined}
              style={{ animationDelay: `${delayMs}ms` }}
              className={cn(
                'carivo-fade-in relative flex items-start gap-3',
                // Vertical (cột hẹp): mỗi bước 1 hàng, connector đứng nối xuống.
                isVertical
                  ? 'pb-6 last:pb-0'
                  : cn(
                      'flex-1 pb-6 last:pb-0 md:pb-0',
                      'md:flex-col md:items-center md:text-center md:gap-2',
                    ),
              )}
            >
              {/* Connector line trước dot (trừ step đầu) */}
              {index > 0 ? (
                <div
                  aria-hidden="true"
                  className={cn(
                    'absolute rounded-full transition-all duration-500',
                    isVertical
                      ? 'left-4 top-0 h-7 w-[2px] -translate-y-7'
                      : cn(
                          'left-4 top-4 h-7 w-[2px] -translate-y-7 md:left-1/2 md:top-7 md:h-[2px] md:w-[calc(100%-2rem)] md:-translate-x-1/2 md:translate-y-0',
                        ),
                    styles.line,
                  )}
                />
              ) : null}

              {/* Dot indicator */}
              <div
                className={cn(
                  'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                  styles.dot,
                )}
              >
                {state === 'completed' ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : state === 'current' ? (
                  <StageIcon className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <StageIcon className="h-4 w-4" />
                )}
              </div>

              {/* Content */}
              <div
                className={cn(
                  'min-w-0 flex-1',
                  isVertical
                    ? 'pt-1.5'
                    : 'pt-1.5 md:flex md:w-full md:flex-col md:items-center md:pt-2',
                )}
              >
                <p
                  className={cn(
                    'text-sm leading-tight',
                    styles.label,
                    !isVertical && 'md:text-center',
                  )}
                >
                  {stage.label}
                </p>
                <div
                  className={cn(
                    'mt-1.5 flex items-center gap-1.5',
                    !isVertical && 'md:justify-center',
                  )}
                >
                  <span className={cn(styles.badge)}>
                    <BadgeIcon className="h-3 w-3" />
                    {isCanceled && state !== 'canceled' ? 'Bỏ qua' : styles.badgeText}
                  </span>
                </div>
              </div>

              {/* Spacer giữ kích thước đồng đều giữa các step trong responsive (md) */}
              {!isVertical ? (
                <div
                  aria-hidden="true"
                  className="hidden md:block md:w-full md:flex-1"
                />
              ) : null}

              {/* Marker chỉ cho desktop: vertical separator nét đứt dưới mỗi step trừ step cuối */}
              {isVertical && !isLast ? (
                <div
                  aria-hidden="true"
                  className="absolute left-[18px] top-10 h-[calc(100%-2.5rem)] w-[2px] rounded-full bg-slate-100"
                />
              ) : null}
            </div>
          )
        })}
      </div>

      {isCanceled ? (
        <div
          role="alert"
          className="carivo-fade-in mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
        >
          <X className="h-4 w-4 shrink-0" />
          <span>
            Booking đã{' '}
            <strong>
              {booking.status === 'CANCELED' ? 'huỷ' : 'no-show'}
            </strong>{' '}
            — tiến trình dừng ở bước hiện tại.
          </span>
        </div>
      ) : null}
    </div>
  )
}