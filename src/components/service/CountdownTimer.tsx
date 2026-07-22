import { useEffect, useMemo, useState } from 'react'
import { cn } from '../../lib/utils'

interface CountdownTimerProps {
  /** ISO 8601 kết thúc. BE trả về UTC `endsAt`. */
  endsAt: string | null
  /** ISO 8601 bắt đầu. */
  startedAt: string | null
  /** Trạng thái gốc của BE. */
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'TIMED_OUT' | string
  /** Tổng thời lượng (giây) — dùng cho progress bar khi không có endsAt. */
  totalSeconds?: number | null
  /** Callback mỗi giây nếu parent cần dùng giá trị còn lại (để refresh controls). */
  onTick?: (remainingSeconds: number) => void
  className?: string
}

/**
 * Countdown cho từng service item. Đồng bộ từ server mỗi giây.
 * Server vẫn là nguồn xác thực — UI chỉ hiển thị, không tự quyết định trạng thái.
 */
export function CountdownTimer({
  endsAt,
  startedAt,
  status,
  totalSeconds,
  onTick,
  className,
}: CountdownTimerProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (status !== 'RUNNING' && status !== 'PAUSED') return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [status])

  const { remaining, total } = useMemo(() => {
    if (endsAt) {
      const endMs = new Date(endsAt).getTime()
      const startMs = startedAt ? new Date(startedAt).getTime() : endMs
      const totalSecs = totalSeconds ?? Math.max(1, Math.round((endMs - startMs) / 1000))
      const remainingSecs = Math.max(
        0,
        Math.round((endMs - now) / 1000),
      )
      if (onTick) {
        // Schedule notification without re-render thrash
        queueMicrotask(() => onTick(remainingSecs))
      }
      return { remaining: remainingSecs, total: totalSecs }
    }

    if (totalSeconds && totalSeconds > 0) {
      return { remaining: totalSeconds, total: totalSeconds }
    }

    return { remaining: 0, total: 0 }
  }, [endsAt, startedAt, now, totalSeconds, onTick])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const formatted = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`

  const progressPct =
    total > 0 ? Math.min(100, Math.max(0, ((total - remaining) / total) * 100)) : 0

  const colorClass =
    status === 'COMPLETED'
      ? 'bg-emerald-500'
      : status === 'PAUSED'
        ? 'bg-amber-500'
        : status === 'TIMED_OUT' || remaining === 0
          ? 'bg-red-500'
          : 'bg-brand-500'

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-2xl font-bold tabular-nums text-slate-900">
          {formatted}
        </span>
        <span className="text-xs text-slate-500">
          {status === 'PAUSED'
            ? 'Đang tạm dừng'
            : status === 'COMPLETED'
              ? 'Hoàn thành'
              : status === 'TIMED_OUT'
                ? 'Hết giờ'
                : status === 'PENDING'
                  ? 'Chưa bắt đầu'
                  : 'Đang đếm ngược'}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full transition-all duration-300', colorClass)}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  )
}
