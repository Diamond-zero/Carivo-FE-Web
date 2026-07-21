import { AlertTriangle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../../../ui/Button'
import { Label } from '../../../ui/Label'
import { Modal } from '../../../ui/Modal'
import { Select } from '../../../ui/Select'
import { useToast } from '../../../../contexts/ToastContext'
import {
  INCIDENT_TYPE_LABELS,
  reportBookingIncidentApi,
} from '../../../../api/incident.api'
import type {
  ApiBookingItem,
  ApiBookingIncidentType,
  ApiWashBay,
} from '../../../../types/api/staff'

interface IncidentReportModalProps {
  open: boolean
  bookingId: string
  bookingItems: ApiBookingItem[]
  washBays: ApiWashBay[]
  onClose: () => void
  /** BE đã tạo incident + trả về booking mới (status = AWAITING_CUSTOMER_DECISION). */
  onReported: (incidentId: string) => void
}

export function IncidentReportModal({
  open,
  bookingId,
  bookingItems,
  washBays,
  onClose,
  onReported,
}: IncidentReportModalProps) {
  const { showToast } = useToast()
  const [incidentType, setIncidentType] =
    useState<ApiBookingIncidentType>('WASH_BAY_FAILURE')
  const [affectedItemKey, setAffectedItemKey] = useState<string>('')
  const [affectedWashBayId, setAffectedWashBayId] = useState<string>('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const requiresDescription = incidentType === 'OTHER_GARAGE_INCIDENT'
  const requiresWashBay = incidentType === 'WASH_BAY_FAILURE'
  const requiresItem = incidentType !== 'OTHER_GARAGE_INCIDENT'

  const itemOptions = useMemo(
    () =>
      bookingItems.map((item) => ({
        key: item.item_key,
        label: `#${item.sequence} — ${item.name_snapshot}`,
      })),
    [bookingItems],
  )

  const reset = () => {
    setIncidentType('WASH_BAY_FAILURE')
    setAffectedItemKey('')
    setAffectedWashBayId('')
    setDescription('')
  }

  const handleSubmit = async () => {
    if (requiresDescription && !description.trim()) {
      showToast('Vui lòng nhập mô tả cho sự cố.', 'error')
      return
    }
    if (requiresWashBay && !affectedWashBayId) {
      showToast('Vui lòng chọn buồng rửa bị sự cố.', 'error')
      return
    }
    if (requiresItem && !affectedItemKey) {
      showToast('Vui lòng chọn hạng mục dịch vụ bị ảnh hưởng.', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await reportBookingIncidentApi(bookingId, {
        incident_type: incidentType,
        description: description.trim() || undefined,
        affected_booking_item_key: affectedItemKey || undefined,
        affected_wash_bay_id: affectedWashBayId || undefined,
      })

      showToast(
        `Đã báo cáo sự cố. Hệ thống đang chờ khách hàng phản hồi.`,
        'success',
      )
      onReported(result.incident.id)
      reset()
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Không thể báo cáo sự cố.',
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
      title="Báo cáo sự cố garage"
      description="Booking sẽ được chuyển sang trạng thái chờ khách hàng phản hồi. Hệ thống tự động tạm dừng các thao tác dịch vụ và thông báo cho khách."
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <strong>Lưu ý:</strong> Với booking đã thanh toán, hệ thống sẽ trả
              lỗi <code>BOOKING_INCIDENT_PAYMENT_REFUND_REQUIRED</code>. Hãy xử
              lý hoàn tiền qua payment provider trước khi báo cáo sự cố.
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="incident-type" required>
            Loại sự cố
          </Label>
          <Select
            id="incident-type"
            value={incidentType}
            onChange={(event) =>
              setIncidentType(
                event.target.value as ApiBookingIncidentType,
              )
            }
          >
            {(Object.keys(INCIDENT_TYPE_LABELS) as ApiBookingIncidentType[]).map(
              (type) => (
                <option key={type} value={type}>
                  {INCIDENT_TYPE_LABELS[type]}
                </option>
              ),
            )}
          </Select>
        </div>

        {requiresItem ? (
          <div>
            <Label htmlFor="incident-item" required>
              Hạng mục dịch vụ bị ảnh hưởng
            </Label>
            <Select
              id="incident-item"
              value={affectedItemKey}
              onChange={(event) => setAffectedItemKey(event.target.value)}
            >
              <option value="">— Chọn hạng mục —</option>
              {itemOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {requiresWashBay ? (
          <div>
            <Label htmlFor="incident-wash-bay" required>
              Buồng rửa bị sự cố
            </Label>
            <Select
              id="incident-wash-bay"
              value={affectedWashBayId}
              onChange={(event) => setAffectedWashBayId(event.target.value)}
            >
              <option value="">— Chọn buồng —</option>
              {washBays.map((bay) => (
                <option key={bay.id} value={bay.id}>
                  {bay.name} ({bay.bay_code})
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div>
          <Label htmlFor="incident-description" required={requiresDescription}>
            Mô tả {requiresDescription ? '' : '(tùy chọn)'}
          </Label>
          <textarea
            id="incident-description"
            className="min-h-[100px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
            placeholder={
              requiresDescription
                ? 'Mô tả chi tiết sự cố…'
                : 'Thêm ghi chú cho sự cố…'
            }
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang báo cáo…' : 'Báo cáo sự cố'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
