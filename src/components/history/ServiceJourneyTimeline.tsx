import { Check, Circle, Clock, Flag, Wallet } from 'lucide-react'
import { formatDateTime } from '../../utils/format'
import { cn } from '../../lib/utils'

interface ServiceJourneyTimelineProps {
  serviceStartedAt?: string | null | undefined
  serviceCompletedAt?: string | null | undefined
  paidAt?: string | null | undefined
  className?: string
}

interface JourneyMilestone {
  key: string
  label: string
  timestamp?: string | null
  Icon: typeof Check
}

const ICON_CLS = 'h-3.5 w-3.5'

/**
 * Mini timeline hiển thị hành trình phục vụ của một booking đã hoàn tất.
 * Sử dụng cho `WashHistoryDetailModal`. Mỗi mốc có dấu chấm sáng emerald nếu
 * đã có timestamp, mờ slate nếu thiếu. Animation stagger theo index.
 */
export function ServiceJourneyTimeline({
  serviceStartedAt,
  serviceCompletedAt,
  paidAt,
  className,
}: ServiceJourneyTimelineProps) {
  const milestones: JourneyMilestone[] = [
    {
      key: 'started',
      label: 'Bắt đầu dịch vụ',
      timestamp: serviceStartedAt,
      Icon: Clock,
    },
    {
      key: 'completed',
      label: 'Hoàn thành dịch vụ',
      timestamp: serviceCompletedAt,
      Icon: Flag,
    },
    {
      key: 'paid',
      label: 'Thanh toán',
      timestamp: paidAt,
      Icon: Wallet,
    },
  ]

  const hasAnyData = milestones.some((m) => Boolean(m.timestamp))

  if (!hasAnyData) {
    return (
      <p
        className={cn(
          'text-sm text-slate-500 italic',
          className,
        )}
      >
        Lịch sử rửa này chưa ghi nhận mốc thời gian nào.
      </p>
    )
  }

  return (
    <ol
      aria-label="Hành trình phục vụ"
      className={cn('relative space-y-2.5', className)}
    >
      {milestones.map((m, idx) => {
        const isDone = Boolean(m.timestamp)
        return (
          <li
            key={m.key}
            style={{ animationDelay: `${idx * 80}ms` }}
            className="carivo-fade-in relative flex items-start gap-3 pl-10"
          >
            {/* Connector line between items */}
            {idx < milestones.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute left-[15px] top-7 h-5 w-px bg-slate-200"
              />
            ) : null}
            {/* Indicator */}
            <span
              className={cn(
                'absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full ring-4 transition-all duration-300',
                isDone
                  ? 'bg-emerald-500 text-white ring-emerald-100 shadow-sm shadow-emerald-500/30'
                  : 'bg-slate-50 text-slate-300 ring-slate-100',
              )}
            >
              {isDone ? (
                <Check className={ICON_CLS} strokeWidth={3} />
              ) : (
                <Circle className={ICON_CLS} />
              )}
            </span>
            {/* Content */}
            <div className="min-w-0 flex-1 pt-1.5">
              <p
                className={cn(
                  'text-sm font-medium leading-tight',
                  isDone ? 'text-slate-900' : 'text-slate-400',
                )}
              >
                {m.label}
              </p>
              <p
                className={cn(
                  'mt-0.5 text-xs tabular-nums',
                  isDone ? 'text-slate-500' : 'text-slate-400 italic',
                )}
              >
                {isDone && m.timestamp
                  ? formatDateTime(m.timestamp)
                  : 'Chưa ghi nhận'}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}