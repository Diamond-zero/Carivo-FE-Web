import { Loader2, Pause, Play, RefreshCcw, CheckCircle2, XCircle } from 'lucide-react'
import { CountdownTimer } from './CountdownTimer'
import { Button } from '../ui/Button'
import type { ApiServiceWorkflowItem } from '../../types/api/staff'

interface ServiceWorkflowItemCardProps {
  item: ApiServiceWorkflowItem
  isMutating: boolean
  onCompleteEarly: () => void
  onConfirmComplete: () => void
  onPause: () => void
  onResume: () => void
}

export function ServiceWorkflowItemCard({
  item,
  isMutating,
  onCompleteEarly,
  onConfirmComplete,
  onPause,
  onResume,
}: ServiceWorkflowItemCardProps) {
  const { status, controls, duration_seconds, started_at, ends_at } = item
  const isCurrent = status === 'RUNNING' || status === 'PAUSED' || status === 'TIMED_OUT'
  const cardBg = isCurrent
    ? 'border-brand-300 bg-brand-50/40'
    : status === 'COMPLETED'
      ? 'border-emerald-200 bg-emerald-50/30'
      : 'border-slate-200 bg-white'

  return (
    <div className={`rounded-2xl border p-4 ${cardBg}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-500">#{item.sequence}</span>
            <h4 className="font-semibold text-slate-900">{item.step_name}</h4>
          </div>
          {item.step_code ? (
            <p className="mt-0.5 text-xs text-slate-500">{item.step_code}</p>
          ) : null}
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-3">
        <CountdownTimer
          endsAt={ends_at}
          startedAt={started_at}
          status={status}
          totalSeconds={duration_seconds}
        />
      </div>

      {isCurrent ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {status === 'TIMED_OUT' || (status === 'RUNNING' && remainingSeconds(item) === 0) ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!controls.can_confirm_complete || isMutating}
              onClick={onConfirmComplete}
            >
              {isMutating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang xác nhận…
                </>
              ) : (
                <>
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Xác nhận hoàn thành
                </>
              )}
            </Button>
          ) : null}

          {controls.can_complete_early ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isMutating}
              onClick={onCompleteEarly}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Hoàn thành sớm
            </Button>
          ) : null}

          {status === 'RUNNING' && controls.can_pause ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isMutating}
              onClick={onPause}
            >
              <Pause className="h-3.5 w-3.5" />
              Tạm dừng
            </Button>
          ) : null}

          {status === 'PAUSED' && controls.can_resume ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isMutating}
              onClick={onResume}
            >
              <Play className="h-3.5 w-3.5" />
              Tiếp tục
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Hoàn thành
      </span>
    )
  }
  if (status === 'PAUSED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        <Pause className="h-3.5 w-3.5" />
        Tạm dừng
      </span>
    )
  }
  if (status === 'TIMED_OUT') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
        <XCircle className="h-3.5 w-3.5" />
        Hết giờ
      </span>
    )
  }
  if (status === 'RUNNING') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
        Đang chạy
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
      Chờ
    </span>
  )
}

function remainingSeconds(item: ApiServiceWorkflowItem): number {
  if (!item.ends_at) return 0
  const ms = new Date(item.ends_at).getTime() - Date.now()
  return Math.max(0, Math.round(ms / 1000))
}
