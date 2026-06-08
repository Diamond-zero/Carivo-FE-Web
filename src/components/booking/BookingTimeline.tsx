import { Check } from 'lucide-react'
import type { Booking } from '../../types/booking'
import {
  BOOKING_TIMELINE_STAGES,
  getTimelineItemState,
} from '../../utils/bookingTimeline'
import { cn } from '../../lib/utils'

interface BookingTimelineProps {
  booking: Booking
  className?: string
}

const stateStyles = {
  completed: {
    dot: 'border-blue-600 bg-blue-600 text-white',
    line: 'bg-blue-600',
    label: 'text-blue-700 font-medium',
  },
  current: {
    dot: 'border-blue-600 bg-white text-blue-600 ring-4 ring-blue-100',
    line: 'bg-slate-200',
    label: 'text-blue-700 font-semibold',
  },
  upcoming: {
    dot: 'border-slate-300 bg-white text-slate-300',
    line: 'bg-slate-200',
    label: 'text-slate-400',
  },
  canceled: {
    dot: 'border-red-300 bg-red-50 text-red-400',
    line: 'bg-slate-200',
    label: 'text-slate-400',
  },
}

export function BookingTimeline({ booking, className }: BookingTimelineProps) {
  const isCanceled =
    booking.status === 'CANCELED' || booking.status === 'NO_SHOW'

  return (
    <div className={cn('w-full', className)}>
      <div className="flex flex-col gap-0 md:flex-row md:items-start md:justify-between">
        {BOOKING_TIMELINE_STAGES.map((stage, index) => {
          const state = getTimelineItemState(booking, stage.key)
          const styles = stateStyles[state]
          const isLast = index === BOOKING_TIMELINE_STAGES.length - 1

          return (
            <div
              key={stage.key}
              className={cn(
                'relative flex flex-1 items-start gap-3 md:flex-col md:items-center md:text-center',
                !isLast && 'pb-6 md:pb-0',
              )}
            >
              {!isLast ? (
                <div
                  className={cn(
                    'absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 md:left-[50%] md:top-4 md:h-0.5 md:w-full md:-translate-x-1/2',
                    state === 'completed' ? styles.line : 'bg-slate-200',
                  )}
                />
              ) : null}

              <div
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs',
                  styles.dot,
                )}
              >
                {state === 'completed' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              <div className="min-w-0 pt-0.5 md:pt-3">
                <p className={cn('text-sm', styles.label)}>{stage.label}</p>
                {state === 'current' && !isCanceled ? (
                  <p className="mt-0.5 text-xs text-blue-500">Hiện tại</p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {isCanceled ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          Booking đã {booking.status === 'CANCELED' ? 'hủy' : 'no-show'}
        </p>
      ) : null}
    </div>
  )
}
