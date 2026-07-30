import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../ui/Button'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import { Select } from '../../ui/Select'
import { useToast } from '../../../contexts/ToastContext'
import {
  INCIDENT_CONTACT_LABELS,
  INCIDENT_DECISION_LABELS,
  getIncidentResolutionOptionsApi,
  recordCustomerDecisionApi,
} from '../../../api/incident.api'
import type {
  ApiIncidentContactChannel,
  ApiIncidentDecision,
  ApiLateArrivalSuggestedSlot,
} from '../../../types/api/staff'
import { formatBookingLocalTime } from '../../../utils/booking'

interface IncidentResolutionModalProps {
  open: boolean
  bookingId: string
  incidentId: string
  onClose: () => void
  onResolved: () => void
}

interface DecisionOption {
  value: ApiIncidentDecision
  label: string
  requiresNewStartTime: boolean
  description: string
}

type ContinuationPolicy = 'RESUME_REMAINING' | 'RESTART_CURRENT_ITEM'

const DECISION_OPTIONS: DecisionOption[] = [
  {
    value: 'REASSIGN_AND_CONTINUE',
    label: INCIDENT_DECISION_LABELS.REASSIGN_AND_CONTINUE,
    requiresNewStartTime: false,
    description:
      'Phân bổ lại buồng rửa/nhân viên khác rồi tiếp tục hoặc làm lại hạng mục đang dở.',
  },
  {
    value: 'RESCHEDULE_NEAREST',
    label: INCIDENT_DECISION_LABELS.RESCHEDULE_NEAREST,
    requiresNewStartTime: false,
    description: 'Backend tự chọn khung giờ hợp lệ gần nhất trong danh sách gợi ý.',
  },
  {
    value: 'RESCHEDULE_CUSTOM',
    label: INCIDENT_DECISION_LABELS.RESCHEDULE_CUSTOM,
    requiresNewStartTime: true,
    description: 'Khách chọn một khung giờ hợp lệ từ danh sách hệ thống gợi ý.',
  },
  {
    value: 'CANCEL_BY_GARAGE',
    label: INCIDENT_DECISION_LABELS.CANCEL_BY_GARAGE,
    requiresNewStartTime: false,
    description:
      'Hủy booking — không tính vi phạm khách, hoàn điểm đã dùng, giải phóng voucher nếu có.',
  },
]

export function IncidentResolutionModal({
  open,
  bookingId,
  incidentId,
  onClose,
  onResolved,
}: IncidentResolutionModalProps) {
  const { showToast } = useToast()
  const [decision, setDecision] = useState<ApiIncidentDecision>(
    'REASSIGN_AND_CONTINUE',
  )
  const [newStartTime, setNewStartTime] = useState<string>('')
  const [contactChannel, setContactChannel] =
    useState<ApiIncidentContactChannel>('PHONE')
  const [continuationPolicy, setContinuationPolicy] =
    useState<ContinuationPolicy>('RESUME_REMAINING')
  const [customerNote, setCustomerNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const optionsQuery = useQuery({
    queryKey: ['incident-resolution-options', bookingId, incidentId],
    queryFn: () => getIncidentResolutionOptionsApi(bookingId, incidentId),
    enabled: open && Boolean(bookingId) && Boolean(incidentId),
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!open) {
      setDecision('REASSIGN_AND_CONTINUE')
      setNewStartTime('')
      setCustomerNote('')
      setContactChannel('PHONE')
      setContinuationPolicy('RESUME_REMAINING')
    }
  }, [open])

  const decisionOptions = optionsQuery.data?.available_actions?.length
    ? DECISION_OPTIONS.filter((option) =>
        optionsQuery.data?.available_actions.includes(option.value),
      )
    : DECISION_OPTIONS

  useEffect(() => {
    if (!open || decisionOptions.some((option) => option.value === decision)) {
      return
    }
    setDecision(decisionOptions[0]?.value ?? 'CANCEL_BY_GARAGE')
  }, [decision, decisionOptions, open])

  const currentOption = DECISION_OPTIONS.find(
    (option) => option.value === decision,
  )
  const requiresStartTime = currentOption?.requiresNewStartTime ?? false
  const suggestedSlots: ApiLateArrivalSuggestedSlot[] =
    (optionsQuery.data?.suggested_slots ?? []).filter(
      (slot) => slot.is_available !== false,
    )
  const nearestSlot = suggestedSlots[0]
  const usesContinuationPolicy = decision !== 'CANCEL_BY_GARAGE'

  const handleSubmit = async () => {
    if (requiresStartTime && !newStartTime) {
      showToast('Vui lòng chọn khung giờ mới cho khách.', 'error')
      return
    }
    if (decision === 'RESCHEDULE_NEAREST' && !nearestSlot) {
      showToast('Hiện chưa có khung giờ trống gần nhất để chuyển lịch.', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      await recordCustomerDecisionApi(bookingId, incidentId, {
        decision,
        new_start_time: requiresStartTime ? newStartTime : undefined,
        continuation_policy: usesContinuationPolicy
          ? continuationPolicy
          : undefined,
        contact_channel: contactChannel,
        customer_note: customerNote.trim() || undefined,
      })
      showToast('Đã ghi nhận quyết định và áp dụng xử lý.', 'success')
      onResolved()
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'Không thể ghi nhận quyết định.',
        'error',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Xử lý sự cố"
      description="Chọn phương án xử lý theo quyết định của khách hàng."
    >
      <div className="space-y-4">
        <div>
          <Label required>Phương án</Label>
          <div className="space-y-2">
            {decisionOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/90 bg-white p-3 text-sm hover:bg-slate-50"
              >
                <input
                  type="radio"
                  name="decision"
                  className="mt-1"
                  checked={decision === option.value}
                  onChange={() => setDecision(option.value)}
                />
                <div>
                  <div className="font-medium text-slate-900">
                    {option.label}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="incident-contact" required>
            Kênh nhận quyết định
          </Label>
          <Select
            id="incident-contact"
            value={contactChannel}
            onChange={(event) =>
              setContactChannel(event.target.value as ApiIncidentContactChannel)
            }
          >
            {(Object.keys(INCIDENT_CONTACT_LABELS) as ApiIncidentContactChannel[]).map(
              (key) => (
                <option key={key} value={key}>
                  {INCIDENT_CONTACT_LABELS[key]}
                </option>
              ),
            )}
          </Select>
        </div>

        {requiresStartTime ? (
          <div>
            <Label htmlFor="incident-new-start" required>
              Khung giờ mới
            </Label>
            {suggestedSlots.length > 0 ? (
              <Select
                id="incident-new-start"
                value={newStartTime}
                onChange={(event) => setNewStartTime(event.target.value)}
              >
                <option value="">— Chọn khung trống —</option>
                {suggestedSlots.map((slot) => (
                  <option
                    key={slot.start_time}
                    value={slot.start_time}
                  >
                    {formatBookingLocalTime(slot.start_time)}
                  </option>
                ))}
              </Select>
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Chưa có khung giờ hợp lệ trong danh sách gợi ý. Hãy tải lại hoặc
                chọn phương án khác.
              </p>
            )}
          </div>
        ) : null}

        {decision === 'RESCHEDULE_NEAREST' && nearestSlot ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Hệ thống sẽ chọn khung gần nhất:{' '}
            <strong>{formatBookingLocalTime(nearestSlot.start_time)}</strong>.
          </div>
        ) : null}

        {usesContinuationPolicy ? (
          <div>
            <Label htmlFor="incident-continuation-policy" required>
              Cách tiếp tục hạng mục đang dở
            </Label>
            <Select
              id="incident-continuation-policy"
              value={continuationPolicy}
              onChange={(event) =>
                setContinuationPolicy(event.target.value as ContinuationPolicy)
              }
            >
              <option value="RESUME_REMAINING">
                Tiếp tục phần thời gian còn lại
              </option>
              <option value="RESTART_CURRENT_ITEM">
                Làm lại toàn bộ hạng mục hiện tại
              </option>
            </Select>
          </div>
        ) : null}

        <div>
          <Label htmlFor="incident-customer-note">Ghi chú từ khách</Label>
          <textarea
            id="incident-customer-note"
            className="min-h-[80px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
            placeholder="Ghi chú thêm (nếu có)…"
            value={customerNote}
            onChange={(event) => setCustomerNote(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Đang xử lý…' : 'Áp dụng xử lý'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
