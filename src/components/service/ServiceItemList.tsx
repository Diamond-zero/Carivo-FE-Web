import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Clock3,
  FastForward,
  Loader2,
  Pause,
  Play,
  ShieldAlert,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import { PauseServiceItemModal } from './PauseServiceItemModal'
import { ReportIncidentStaffModal } from './ReportIncidentStaffModal'
import { useToast } from '../../contexts/ToastContext'
import {
  useCompleteServiceItemEarly,
  useConfirmServiceItemComplete,
  usePauseServiceItem,
  useResumeServiceItem,
} from '../../hooks/api/staff/useStaffTasks'
import { useMyCapabilities } from '../../hooks/api/staff/useStaffCapabilities'
import { getApiErrorMessage } from '../../api/client'
import type { ApiBookingItem, ApiWashBay } from '../../types/api/staff'
import type {
  ApiServiceItem,
  ApiWorkspaceWorkflow,
} from '../../types/api/workspace'

interface ServiceItemListProps {
  bookingId: string
  workflow: ApiWorkspaceWorkflow | undefined
  /** BE `booking_items` để feed vào IncidentReportModal. */
  bookingItems: ApiBookingItem[]
  /** Wash bay để chọn khi incident WASH_BAY_FAILURE. */
  washBays: ApiWashBay[]
}

/**
 * Render danh sách service items của một booking IN_PROGRESS cho staff task
 * view (Wash Operator / Vehicle Care Staff).
 *
 * Mỗi item hiển thị:
 *  - Sequence + tên + trạng thái badge
 *  - Countdown timer (đếm ngược tới `countdown_ends_at`) cho IN_PROGRESS
 *  - Progress bar (% đã hoàn thành dựa trên elapsed / duration)
 *  - Action buttons theo trạng thái + capability:
 *      IN_PROGRESS + assigned → Tạm dừng / Hoàn thành sớm / Báo sự cố
 *      PAUSED → Tiếp tục / Hoàn thành sớm / Báo sự cố
 *      AWAITING_CONFIRMATION (transition_mode = REQUIRE_CONFIRMATION)
 *        → Xác nhận hoàn thành
 *      DONE → check icon
 *
 * Lý do: `ServiceStepList` cũ chỉ render step-level (PENDING/IN_PROGRESS/DONE)
 * → wash/care staff không thấy được countdown tự động của từng item, cũng không
 * có nút pause/resume/complete-early/report-incident → staff "mất trang"
 * giữa chừng vì không có action nào để tương tác với workflow.
 */
export function ServiceItemList({
  bookingId,
  workflow,
  bookingItems,
  washBays,
}: ServiceItemListProps) {
  const { showToast } = useToast()
  const staffCapabilities = useMyCapabilities()

  const items = workflow?.service_items ?? []
  const blockedByIncident = Boolean(workflow?.blocked_by_incident)

  // Mutations
  const pauseMutation = usePauseServiceItem()
  const resumeMutation = useResumeServiceItem()
  const completeEarlyMutation = useCompleteServiceItemEarly()
  const confirmMutation = useConfirmServiceItemComplete()

  // Modal state
  const [pauseTarget, setPauseTarget] = useState<ApiServiceItem | null>(null)
  const [incidentDefaultItemKey, setIncidentDefaultItemKey] = useState<
    string | undefined
  >(undefined)
  const [isIncidentOpen, setIsIncidentOpen] = useState(false)

  // Current time tick — để countdown realtime hiển thị. Cập nhật mỗi 1s.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(handle)
  }, [])

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Booking chưa có hạng mục dịch vụ. Hãy chờ hệ thống khởi tạo workflow.
      </p>
    )
  }

  const handlePause = async (reason: string) => {
    if (!pauseTarget) return
    try {
      await pauseMutation.mutateAsync({
        bookingId,
        itemKey: pauseTarget.item_key,
        payload: { reason },
      })
      showToast('Đã tạm dừng hạng mục.', 'success')
      setPauseTarget(null)
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể tạm dừng.'), 'error')
    }
  }

  const handleResume = async (item: ApiServiceItem) => {
    try {
      await resumeMutation.mutateAsync({
        bookingId,
        itemKey: item.item_key,
      })
      showToast('Đã tiếp tục hạng mục.', 'success')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể tiếp tục.'), 'error')
    }
  }

  const handleCompleteEarly = async (item: ApiServiceItem) => {
    try {
      await completeEarlyMutation.mutateAsync({
        bookingId,
        itemKey: item.item_key,
      })
      showToast('Đã đánh dấu hoàn thành sớm.', 'success')
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể hoàn thành sớm.'),
        'error',
      )
    }
  }

  const handleConfirmComplete = async (item: ApiServiceItem) => {
    try {
      await confirmMutation.mutateAsync({
        bookingId,
        itemKey: item.item_key,
      })
      showToast('Đã xác nhận hoàn thành.', 'success')
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể xác nhận hoàn thành.'),
        'error',
      )
    }
  }

  const openIncidentModal = (itemKey?: string) => {
    setIncidentDefaultItemKey(itemKey)
    setIsIncidentOpen(true)
  }

  // Capabilities
  const canReportWashBay = staffCapabilities.includes(
    'incident.report_wash_bay_failure',
  )
  const canReportStaff = staffCapabilities.includes(
    'incident.report_staff_unavailable',
  )
  const canReportOther = staffCapabilities.includes(
    'incident.report_other_garage',
  )
  const canReportAnyIncident =
    canReportWashBay || canReportStaff || canReportOther

  // BE workspace trả `available_actions` cho booking — single source of truth
  // (đã check capability + assignment + blockers ở BE). Các action level
  // service_item chỉ staff được BE phân công item đó mới nhận được. Khi BE
  // không trả action (vd cache sai hoặc workflow chưa load) → fallback dùng
  // staff capability để tránh khoá UI oan (BE sẽ trả 403 nếu thật sự không
  // được phép).
  const availableActions = workflow?.available_actions ?? []
  const hasExecuteCapability =
    staffCapabilities.includes('service_task.wash.execute_assigned') ||
    staffCapabilities.includes('service_task.care.execute_assigned')

  const canPauseItem = (item: ApiServiceItem) =>
    item.assigned_to_current_user &&
    (availableActions.includes('service_item.pause') ||
      (availableActions.length === 0 && hasExecuteCapability))
  const canResumeItem = (item: ApiServiceItem) =>
    item.assigned_to_current_user &&
    (availableActions.includes('service_item.resume') ||
      (availableActions.length === 0 && hasExecuteCapability))
  const canCompleteEarlyItem = (item: ApiServiceItem) =>
    item.assigned_to_current_user &&
    (availableActions.includes('service_item.complete_early') ||
      (availableActions.length === 0 && hasExecuteCapability))
  const canConfirmCompleteItem = (item: ApiServiceItem) =>
    item.assigned_to_current_user &&
    (availableActions.includes('service_item.confirm_complete') ||
      (availableActions.length === 0 && hasExecuteCapability))

  return (
    <ul className="space-y-4">
      {blockedByIncident ? (
        <li className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <strong>Booking đang bị tạm dừng do sự cố.</strong> Mọi thao tác
            dịch vụ sẽ bị khóa cho tới khi khách hàng phản hồi. Bạn vẫn có thể
            xem workflow nhưng không thể pause/resume/complete.
          </div>
        </li>
      ) : null}

      {items.map((item) => (
        <ServiceItemCard
          key={item.item_key}
          item={item}
          now={now}
          canPause={canPauseItem(item) && !blockedByIncident}
          canResume={canResumeItem(item) && !blockedByIncident}
          canCompleteEarly={canCompleteEarlyItem(item) && !blockedByIncident}
          canConfirmComplete={canConfirmCompleteItem(item) && !blockedByIncident}
          canReportIncident={canReportAnyIncident && !blockedByIncident}
          onPause={() => setPauseTarget(item)}
          onResume={() => void handleResume(item)}
          onCompleteEarly={() => void handleCompleteEarly(item)}
          onConfirmComplete={() => void handleConfirmComplete(item)}
          onReportIncident={() => openIncidentModal(item.item_key)}
          isPausePending={pauseMutation.isPending && pauseTarget?.item_key === item.item_key}
          isResumePending={resumeMutation.isPending}
          isCompleteEarlyPending={completeEarlyMutation.isPending}
          isConfirmPending={confirmMutation.isPending}
        />
      ))}

      {/* Modals */}
      {pauseTarget ? (
        <PauseServiceItemModal
          open={Boolean(pauseTarget)}
          itemName={pauseTarget.name}
          isSubmitting={pauseMutation.isPending}
          onClose={() => !pauseMutation.isPending && setPauseTarget(null)}
          onConfirm={handlePause}
        />
      ) : null}

      <ReportIncidentStaffModal
        open={isIncidentOpen}
        bookingId={bookingId}
        bookingItems={bookingItems}
        washBays={washBays}
        defaultItemKey={incidentDefaultItemKey}
        onClose={() => setIsIncidentOpen(false)}
      />

      {!blockedByIncident &&
      items.some((i) => i.status === 'IN_PROGRESS') &&
      (availableActions.includes('service_item.pause') ||
        availableActions.includes('service_item.complete_early') ||
        (availableActions.length === 0 && hasExecuteCapability)) ? (
        <li className="flex justify-end pt-1">
          <Button
            variant="danger"
            size="sm"
            onClick={() => openIncidentModal()}
            disabled={!canReportAnyIncident}
            title={
              canReportAnyIncident
                ? 'Báo cáo sự cố xảy ra trong quá trình thực hiện'
                : 'Bạn không có quyền báo cáo sự cố'
            }
          >
            <AlertTriangle className="h-4 w-4" />
            Báo cáo sự cố
          </Button>
        </li>
      ) : null}
    </ul>
  )
}

interface ServiceItemCardProps {
  item: ApiServiceItem
  now: number
  canPause: boolean
  canResume: boolean
  canCompleteEarly: boolean
  canConfirmComplete: boolean
  canReportIncident: boolean
  onPause: () => void
  onResume: () => void
  onCompleteEarly: () => void
  onConfirmComplete: () => void
  onReportIncident: () => void
  isPausePending: boolean
  isResumePending: boolean
  isCompleteEarlyPending: boolean
  isConfirmPending: boolean
}

function ServiceItemCard({
  item,
  now,
  canPause,
  canResume,
  canCompleteEarly,
  canConfirmComplete,
  canReportIncident,
  onPause,
  onResume,
  onCompleteEarly,
  onConfirmComplete,
  onReportIncident,
  isPausePending,
  isResumePending,
  isCompleteEarlyPending,
  isConfirmPending,
}: ServiceItemCardProps) {
  const [expanded, setExpanded] = useState(item.status === 'IN_PROGRESS')

  // Tính % tiến độ + thời gian còn lại
  const countdownMs = useMemo(() => {
    if (!item.countdown_ends_at) return null
    return new Date(item.countdown_ends_at).getTime() - now
  }, [item.countdown_ends_at, now])

  const totalDurationMs = item.duration_minutes * 60_000
  const elapsedMs = useMemo(() => {
    if (!item.actual_started_at) return 0
    const startedAt = new Date(item.actual_started_at).getTime()
    if (item.status === 'PAUSED' && item.remaining_seconds_at_pause != null) {
      const remainingAtPause = item.remaining_seconds_at_pause * 1000
      // Elapsed = total - remaining
      return Math.max(0, totalDurationMs - remainingAtPause)
    }
    return Math.max(0, now - startedAt)
  }, [item.actual_started_at, item.status, item.remaining_seconds_at_pause, now, totalDurationMs])

  const progress = useMemo(() => {
    if (item.status === 'DONE' || item.status === 'SKIPPED') return 100
    if (item.status === 'PENDING') return 0
    if (totalDurationMs <= 0) return 0
    return Math.min(100, Math.round((elapsedMs / totalDurationMs) * 100))
  }, [item.status, elapsedMs, totalDurationMs])

  const remainingSeconds =
    countdownMs == null ? null : Math.max(0, Math.floor(countdownMs / 1000))
  const formattedRemaining = useMemo(() => {
    if (remainingSeconds == null) return null
    const m = Math.floor(remainingSeconds / 60)
      .toString()
      .padStart(2, '0')
    const s = (remainingSeconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }, [remainingSeconds])

  const isInProgress = item.status === 'IN_PROGRESS'
  const isPaused = item.status === 'PAUSED'
  const isAwaitingConfirmation = item.status === 'AWAITING_CONFIRMATION'
  const isDone = item.status === 'DONE'
  const isSkipped = item.status === 'SKIPPED'
  const isWaitingResource = item.status === 'WAITING_RESOURCE'
  const isPending = item.status === 'PENDING'

  const { icon: StatusIcon, badge, cardBorder } = describeStatus(item.status)

  return (
    <li
      className={cn(
        'rounded-2xl border p-4 transition-colors',
        isDone
          ? 'border-green-200 bg-green-50/50'
          : isPaused
            ? 'border-orange-200 bg-orange-50/40'
            : isAwaitingConfirmation
              ? 'border-blue-200 bg-blue-50/40'
              : isInProgress
                ? 'border-amber-200 bg-amber-50/30'
                : 'border-slate-200 bg-white',
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              Bước {item.sequence}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                badge,
              )}
            >
              <StatusIcon className="mr-1 inline-block h-3 w-3" />
              {STATUS_LABELS[item.status]}
            </span>
            {item.transition_mode === 'AUTO' ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                Tự động
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                Cần xác nhận
              </span>
            )}
            {item.requires_wash_bay ? (
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                Cần buồng rửa
              </span>
            ) : null}
            {item.requires_care_staff ? (
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                Cần nhân viên care
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-base font-semibold text-slate-900">
            {item.name}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Thời lượng dự kiến: {item.duration_minutes} phút
          </p>
        </div>

        {/* Countdown / Action cluster */}
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          {isInProgress && formattedRemaining ? (
            <div className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-right shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                Còn lại
              </p>
              <p className="font-mono text-xl font-bold tabular-nums text-amber-900">
                {formattedRemaining}
              </p>
            </div>
          ) : isPaused && item.remaining_seconds_at_pause != null ? (
            <div className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-right shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-700">
                Tạm dừng lúc
              </p>
              <p className="font-mono text-base font-semibold tabular-nums text-orange-900">
                {formatSeconds(item.remaining_seconds_at_pause)}
              </p>
            </div>
          ) : null}

          {isInProgress && (canPause || canCompleteEarly) ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {canPause ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onPause}
                  disabled={isPausePending}
                >
                  {isPausePending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                  Tạm dừng
                </Button>
              ) : null}
              {canCompleteEarly ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onCompleteEarly}
                  disabled={isCompleteEarlyPending}
                  title="Đánh dấu hoàn thành trước khi hết thời gian"
                >
                  {isCompleteEarlyPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FastForward className="h-4 w-4" />
                  )}
                  Hoàn thành sớm
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="danger"
                onClick={onReportIncident}
                disabled={!canReportIncident}
                title={
                  canReportIncident
                    ? 'Báo cáo sự cố'
                    : 'Bạn không có quyền báo cáo sự cố'
                }
              >
                <AlertTriangle className="h-4 w-4" />
                Báo sự cố
              </Button>
            </div>
          ) : null}

          {isPaused && (canResume || canCompleteEarly) ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {canResume ? (
                <Button size="sm" onClick={onResume} disabled={isResumePending}>
                  {isResumePending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Tiếp tục
                </Button>
              ) : null}
              {canCompleteEarly ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onCompleteEarly}
                  disabled={isCompleteEarlyPending}
                >
                  <FastForward className="h-4 w-4" />
                  Hoàn thành sớm
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="danger"
                onClick={onReportIncident}
                disabled={!canReportIncident}
              >
                <AlertTriangle className="h-4 w-4" />
                Báo sự cố
              </Button>
            </div>
          ) : null}

          {isAwaitingConfirmation && canConfirmComplete ? (
            <Button
              size="sm"
              onClick={onConfirmComplete}
              disabled={isConfirmPending}
            >
              {isConfirmPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Xác nhận hoàn thành
            </Button>
          ) : null}

          {isDone ? (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Đã hoàn thành
            </span>
          ) : null}

          {isSkipped ? (
            <span className="text-sm text-slate-500">Đã bỏ qua</span>
          ) : null}

          {isWaitingResource ? (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-sky-700">
              <Clock3 className="h-4 w-4" />
              Đang chờ tài nguyên
            </span>
          ) : null}

          {isPending ? (
            <span className="inline-flex items-center gap-1 text-sm text-slate-500">
              <CircleDashed className="h-4 w-4" />
              Chờ tới lượt
            </span>
          ) : null}
        </div>
      </div>

      {/* Progress bar (chỉ show cho IN_PROGRESS / PAUSED / DONE) */}
      {!isPending && !isWaitingResource ? (
        <div className="mt-3" data-testid={`service-item-progress-${item.item_key}`}>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Tiến độ</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                'h-full transition-all duration-500',
                isDone
                  ? 'bg-green-500'
                  : isPaused
                    ? 'bg-orange-400'
                    : isAwaitingConfirmation
                      ? 'bg-blue-500'
                      : 'bg-amber-500',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Optional: chi tiết nhỏ */}
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="mt-3 flex w-full items-center gap-2 text-left text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            expanded && 'rotate-180',
          )}
        />
        Chi tiết
      </button>

      {expanded ? (
        <div className="mt-2 space-y-1 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {item.actual_started_at ? (
            <p>
              <strong>Bắt đầu:</strong>{' '}
              {new Date(item.actual_started_at).toLocaleString('vi-VN')}
            </p>
          ) : (
            <p>
              <strong>Bắt đầu:</strong> —
            </p>
          )}
          {item.countdown_ends_at ? (
            <p>
              <strong>Kết thúc dự kiến:</strong>{' '}
              {new Date(item.countdown_ends_at).toLocaleString('vi-VN')}
            </p>
          ) : null}
          {item.actual_completed_at ? (
            <p>
              <strong>Hoàn thành lúc:</strong>{' '}
              {new Date(item.actual_completed_at).toLocaleString('vi-VN')}
            </p>
          ) : null}
          {item.assigned_to_current_user ? (
            <p className="text-emerald-700">
              ✓ Hạng mục này được phân công cho bạn.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Hide card border unused warning */}
      {cardBorder ? null : null}
    </li>
  )
}

const STATUS_LABELS: Record<ApiServiceItem['status'], string> = {
  PENDING: 'Chờ tới lượt',
  IN_PROGRESS: 'Đang thực hiện',
  PAUSED: 'Tạm dừng',
  AWAITING_CONFIRMATION: 'Chờ xác nhận',
  WAITING_RESOURCE: 'Chờ tài nguyên',
  DONE: 'Hoàn thành',
  SKIPPED: 'Đã bỏ qua',
}

function describeStatus(status: ApiServiceItem['status']): {
  icon: LucideIcon
  badge: string
  cardBorder: string
} {
  switch (status) {
    case 'IN_PROGRESS':
      return {
        icon: Loader2,
        badge: 'bg-amber-100 text-amber-800',
        cardBorder: 'border-amber-200',
      }
    case 'PAUSED':
      return {
        icon: Pause,
        badge: 'bg-orange-100 text-orange-800',
        cardBorder: 'border-orange-200',
      }
    case 'AWAITING_CONFIRMATION':
      return {
        icon: Clock3,
        badge: 'bg-blue-100 text-blue-800',
        cardBorder: 'border-blue-200',
      }
    case 'DONE':
      return {
        icon: CheckCircle2,
        badge: 'bg-green-100 text-green-800',
        cardBorder: 'border-green-200',
      }
    case 'SKIPPED':
      return {
        icon: CircleDashed,
        badge: 'bg-slate-100 text-slate-600',
        cardBorder: 'border-slate-200',
      }
    case 'WAITING_RESOURCE':
      return {
        icon: Clock3,
        badge: 'bg-sky-100 text-sky-800',
        cardBorder: 'border-sky-200',
      }
    case 'PENDING':
    default:
      return {
        icon: CircleDashed,
        badge: 'bg-slate-100 text-slate-600',
        cardBorder: 'border-slate-200',
      }
  }
}

function formatSeconds(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const m = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0')
  const s = (safe % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
