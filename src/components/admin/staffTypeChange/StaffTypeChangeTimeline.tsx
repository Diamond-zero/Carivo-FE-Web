import { useEffect, useState } from 'react'
import type { ApiStaffTypeChangeRequest } from '../../../api/staffTypeChange.api'
import { cn } from '../../../lib/utils'

interface CountdownProps {
  /** Thời điểm mục tiêu (ISO). */
  to: string
  /** Khi đạt mốc sẽ gọi callback để UI xử lý (refetch, navigate...). */
  onReached?: () => void
  className?: string
}

function diffParts(targetMs: number, nowMs: number) {
  const diff = Math.max(0, targetMs - nowMs)
  const days = Math.floor(diff / (24 * 3600 * 1000))
  const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000))
  const minutes = Math.floor((diff % (3600 * 1000)) / (60 * 1000))
  const seconds = Math.floor((diff % (60 * 1000)) / 1000)
  return { diff, days, hours, minutes, seconds }
}

/**
 * Đếm ngược thời gian tới `to`. Khi đạt mốc sẽ gọi `onReached` 1 lần.
 */
export function Countdown({ to, onReached, className }: CountdownProps) {
  const targetMs = new Date(to).getTime()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!Number.isFinite(targetMs)) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [targetMs])

  useEffect(() => {
    if (!Number.isFinite(targetMs)) return
    if (now >= targetMs) {
      onReached?.()
    }
  }, [now, targetMs, onReached])

  if (!Number.isFinite(targetMs)) {
    return <span className="text-slate-500">—</span>
  }

  const { diff, days, hours, minutes, seconds } = diffParts(targetMs, now)
  if (diff === 0) {
    return (
      <span className={cn('font-semibold text-emerald-700', className)}>
        Đã tới thời điểm áp dụng
      </span>
    )
  }

  return (
    <span className={cn('font-mono text-sm text-slate-700', className)}>
      {days > 0 ? `${days} ngày ` : ''}
      {`${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}
    </span>
  )
}

interface RequestTimelineProps {
  request: ApiStaffTypeChangeRequest
}

function formatDateTime(value?: string | null) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function Dot({
  tone,
}: {
  tone: 'slate' | 'amber' | 'emerald' | 'red' | 'blue' | 'brand'
}) {
  const map = {
    slate: 'bg-slate-300 ring-slate-200',
    amber: 'bg-amber-400 ring-amber-200',
    emerald: 'bg-emerald-500 ring-emerald-200',
    red: 'bg-red-500 ring-red-200',
    blue: 'bg-blue-500 ring-blue-200',
    brand: 'bg-brand-500 ring-brand-200',
  } as const
  return (
    <span
      className={cn(
        'mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-4',
        map[tone],
      )}
      aria-hidden
    />
  )
}

/**
 * Timeline đầy đủ cho 1 request: requested → approved/rejected/cancelled → applied → acknowledged.
 */
export function StaffTypeChangeTimeline({ request }: RequestTimelineProps) {
  const requestedAt = formatDateTime(request.created_at)
  const approvedAt = formatDateTime(request.approved_at)
  const appliedAt = formatDateTime(request.applied_at)
  const rejectedAt = formatDateTime(request.rejected_at)
  const cancelledAt = formatDateTime(request.cancelled_at)
  const acknowledgedAt = formatDateTime(request.staff_acknowledged_at)

  return (
    <ol className="space-y-4 text-sm">
      <li className="flex gap-3">
        <Dot tone="brand" />
        <div>
          <p className="font-medium text-slate-800">Yêu cầu được tạo</p>
          <p className="text-xs text-slate-500">
            {requestedAt ?? '—'}
            {' · '}
            {request.requester?.full_name ?? request.requested_by ?? '—'}
            {request.requested_by_role ? (
              <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                {request.requested_by_role}
              </span>
            ) : null}
            {request.request_source ? (
              <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                {request.request_source}
              </span>
            ) : null}
          </p>
        </div>
      </li>

      {approvedAt || request.status === 'APPROVED' || request.status === 'SCHEDULED' || request.status === 'APPLIED' ? (
        <li className="flex gap-3">
          <Dot tone="emerald" />
          <div>
            <p className="font-medium text-slate-800">Đã duyệt</p>
            <p className="text-xs text-slate-500">
              {approvedAt ?? '—'}
              {' · '}
              {request.approver?.full_name ?? request.approved_by ?? '—'}
              {request.emergency_override ? (
                <span className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                  EMERGENCY OVERRIDE
                  {request.override_reason ? `: ${request.override_reason}` : ''}
                </span>
              ) : null}
            </p>
          </div>
        </li>
      ) : null}

      {appliedAt || request.status === 'APPLIED' ? (
        <li className="flex gap-3">
          <Dot tone="blue" />
          <div>
            <p className="font-medium text-slate-800">Đã áp dụng</p>
            <p className="text-xs text-slate-500">{appliedAt ?? '—'}</p>
          </div>
        </li>
      ) : null}

      {acknowledgedAt ? (
        <li className="flex gap-3">
          <Dot tone="emerald" />
          <div>
            <p className="font-medium text-slate-800">Nhân viên đã đọc</p>
            <p className="text-xs text-slate-500">{acknowledgedAt}</p>
          </div>
        </li>
      ) : null}

      {rejectedAt ? (
        <li className="flex gap-3">
          <Dot tone="red" />
          <div>
            <p className="font-medium text-slate-800">Bị từ chối</p>
            <p className="text-xs text-slate-500">{rejectedAt}</p>
            {request.decision_reason ? (
              <p className="mt-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                {request.decision_reason}
              </p>
            ) : null}
          </div>
        </li>
      ) : null}

      {cancelledAt ? (
        <li className="flex gap-3">
          <Dot tone="slate" />
          <div>
            <p className="font-medium text-slate-800">Đã hủy</p>
            <p className="text-xs text-slate-500">{cancelledAt}</p>
            {request.decision_reason ? (
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800">
                {request.decision_reason}
              </p>
            ) : null}
          </div>
        </li>
      ) : null}
    </ol>
  )
}
