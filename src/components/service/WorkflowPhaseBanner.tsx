/**
 * WorkflowPhaseBanner — banner compact hiển thị workflow_phase + blockers
 * của booking cho staff nhìn thấy ngay. BE trả đầy đủ metadata qua
 * `GET /staff/workspace/bookings/:id/workflow` (xem BE
 * `staffBookingWorkflow.service.js` → `getWorkflowPhase` + `getWorkflowBlockers`).
 */

import { Camera, CheckCircle2, CircleAlert, ShieldAlert } from 'lucide-react'
import type {
  ApiWorkspaceWorkflow,
  AvailableAction,
  WorkflowBlocker,
  WorkflowPhase,
} from '../../types/api/workspace'
import {
  WORKFLOW_BLOCKER_LABELS,
  WORKFLOW_PHASE_LABELS,
} from '../../types/api/workspace'
import { cn } from '../../lib/utils'

interface WorkflowPhaseBannerProps {
  workflowPhase: WorkflowPhase
  blockers: WorkflowBlocker[]
  availableActions: AvailableAction[]
  className?: string
  /**
   * Truyền cả `workflow` để banner hiển thị thêm ngữ cảnh (số ảnh inspection,
   * tiến độ service item, link nhanh tới /service/execution). Khi không truyền,
   * banner hoạt động như cũ (chỉ phase + blockers + actions).
   */
  workflow?: ApiWorkspaceWorkflow | null
  bookingId?: string
}

const WORKFLOW_PHASE_COLORS: Record<WorkflowPhase, { bg: string; text: string; ring: string }> = {
  WAITING_CHECK_IN: { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' },
  WAITING_BEFORE_WASH_INSPECTION: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  READY_FOR_SERVICE: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
  SERVICE_IN_PROGRESS: { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200' },
  WAITING_AFTER_WASH_INSPECTION: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  READY_TO_COMPLETE_SERVICE: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  READY_FOR_HANDOVER: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  WAITING_CUSTOMER_ACCEPTANCE: { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-200' },
  WAITING_PAYMENT: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200' },
  READY_FOR_RELEASE: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  HANDOVER_ON_HOLD: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
  RELEASED: { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-200' },
  INCIDENT_HOLD: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
  CANCELED: { bg: 'bg-slate-50', text: 'text-slate-500', ring: 'ring-slate-200' },
  NO_SHOW: { bg: 'bg-slate-50', text: 'text-slate-500', ring: 'ring-slate-200' },
}

export { WORKFLOW_PHASE_COLORS }

function summarizeActions(actions: AvailableAction[]): string {
  if (actions.length === 0) {
    return 'Chưa có thao tác khả dụng cho vai trò hiện tại.'
  }

  const labels = new Set<string>()
  for (const action of actions) {
    switch (action) {
      case 'booking.check_in':
        labels.add('check-in')
        break
      case 'booking.service.start':
        labels.add('bắt đầu dịch vụ')
        break
      case 'service_item.pause':
        labels.add('tạm dừng')
        break
      case 'service_item.resume':
        labels.add('tiếp tục')
        break
      case 'service_item.complete_early':
        labels.add('hoàn thành sớm')
        break
      case 'service_item.confirm_complete':
        labels.add('xác nhận hoàn thành')
        break
      case 'booking.service.complete':
        labels.add('hoàn thành dịch vụ')
        break
      case 'inspection.before_wash.create':
        labels.add('kiểm tra trước rửa')
        break
      case 'inspection.after_wash.create':
        labels.add('kiểm tra sau rửa')
        break
      case 'inspection.claim':
        labels.add('nhận kiểm tra')
        break
      case 'booking.payment.collect_cash':
        labels.add('thu tiền mặt')
        break
      case 'handover.prepare':
        labels.add('chuẩn bị bàn giao')
        break
      case 'handover.walk_in_accept':
        labels.add('walk-in khách xác nhận')
        break
      case 'handover.release':
        labels.add('bàn giao xe')
        break
      case 'booking.cancel':
        labels.add('hủy booking')
        break
      case 'booking.mark_no_show':
        labels.add('đánh dấu không đến')
        break
      default:
        break
    }
  }

  if (labels.size === 0) {
    return `${actions.length} thao tác khả dụng.`
  }

  return `Có thể: ${Array.from(labels).join(', ')}.`
}

export function WorkflowPhaseBanner({
  workflowPhase,
  blockers,
  availableActions,
  className,
  workflow,
  bookingId,
}: WorkflowPhaseBannerProps) {
  const phaseColor = WORKFLOW_PHASE_COLORS[workflowPhase]
  const isIncident = workflowPhase === 'INCIDENT_HOLD'
  const visibleBlockers = blockers.filter(
    (blocker) => blocker !== 'INCIDENT_HOLD',
  )

  const inspectionHints = buildInspectionHints(workflow, visibleBlockers)
  const serviceItemHint = buildServiceItemHint(workflow, visibleBlockers)

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 ring-1',
        phaseColor.bg,
        phaseColor.ring,
        className,
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
            phaseColor.bg,
            phaseColor.text,
          )}
        >
          {isIncident ? (
            <ShieldAlert className="h-3.5 w-3.5" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          {WORKFLOW_PHASE_LABELS[workflowPhase]}
        </span>

        <div className="flex-1 text-sm text-slate-700">
          {summarizeActions(availableActions)}
        </div>
      </div>

      {visibleBlockers.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
          {visibleBlockers.map((blocker) => (
            <li
              key={blocker}
              className="flex items-start gap-2 rounded-lg bg-white/60 px-3 py-2"
            >
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>{WORKFLOW_BLOCKER_LABELS[blocker]}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {inspectionHints.length > 0 ? (
        <div className="mt-3 rounded-lg bg-white/60 px-3 py-2 text-xs text-slate-700">
          <p className="flex items-center gap-1.5 font-medium text-slate-800">
            <Camera className="h-3.5 w-3.5" />
            Bằng chứng kiểm tra xe
          </p>
          <ul className="mt-1 space-y-0.5">
            {inspectionHints.map((hint) => (
              <li key={hint.label}>
                {hint.label}:{' '}
                <span
                  className={cn(
                    'font-medium',
                    hint.ok ? 'text-emerald-700' : 'text-red-700',
                  )}
                >
                  {hint.detail}
                </span>
              </li>
            ))}
          </ul>
          {bookingId ? (
            <p className="mt-2 text-[11px] text-slate-500">
              Mở{' '}
              <a
                href={`/service/execution?bookingId=${bookingId}`}
                className="text-brand-700 underline hover:text-brand-900"
              >
                trang thực hiện dịch vụ
              </a>{' '}
              để bổ sung ảnh/biên bản.
            </p>
          ) : null}
        </div>
      ) : null}

      {serviceItemHint ? (
        <p className="mt-2 text-xs text-slate-600">{serviceItemHint}</p>
      ) : null}
    </div>
  )
}

/**
 * Khi workflow có dữ liệu và banner đang cảnh báo về inspection hoặc các
 * bước dịch vụ bắt buộc, hiển thị thêm: BEFORE/AFTER_WASH có bao nhiêu ảnh,
 * đã được kiểm tra hay chưa. Staff wash/care nhìn vào là biết cần upload
 * ảnh vào biên bản nào.
 */
function buildInspectionHints(
  workflow: ApiWorkspaceWorkflow | null | undefined,
  blockers: WorkflowBlocker[],
): Array<{ label: string; ok: boolean; detail: string }> {
  if (!workflow) return []

  const before = workflow.milestones?.before_wash_inspection
  const after = workflow.milestones?.after_wash_inspection
  const needsBefore = blockers.includes('BEFORE_WASH_INSPECTION_REQUIRED')
  const needsAfter =
    blockers.includes('AFTER_WASH_INSPECTION_REQUIRED') ||
    blockers.includes('REQUIRED_SERVICE_STEPS_NOT_DONE')

  const hints: Array<{ label: string; ok: boolean; detail: string }> = []

  if (needsBefore || before) {
    hints.push({
      label: 'Trước rửa (BEFORE_WASH)',
      ok: Boolean(before?.status === 'DONE' && (before.image_count ?? 0) > 0),
      detail: before
        ? `${before.image_count ?? 0} ảnh`
        : 'Chưa tạo biên bản',
    })
  }

  if (needsAfter || after) {
    hints.push({
      label: 'Sau rửa (AFTER_WASH)',
      ok: Boolean(after?.status === 'DONE' && (after.image_count ?? 0) > 0),
      detail: after
        ? `${after.image_count ?? 0} ảnh`
        : 'Chưa tạo biên bản',
    })
  }

  return hints
}

function buildServiceItemHint(
  workflow: ApiWorkspaceWorkflow | null | undefined,
  blockers: WorkflowBlocker[],
): string | null {
  if (!workflow || !blockers.includes('SERVICE_ITEMS_NOT_DONE')) {
    return null
  }

  const items = workflow.service_items ?? []
  if (items.length === 0) {
    return 'Booking chưa có hạng mục dịch vụ nào.'
  }

  const remaining = items.filter(
    (item) => item.status !== 'DONE' && item.status !== 'SKIPPED',
  )
  if (remaining.length === 0) return null

  return (
    <>
      Còn {remaining.length}/{items.length} hạng mục chưa hoàn thành:{' '}
      <span className="font-medium">
        {remaining.map((item) => item.name).join(', ')}
      </span>
      . Cần staff được phân công bấm "Hoàn thành sớm" hoặc "Xác nhận hoàn
      thành".
    </>
  )
}
