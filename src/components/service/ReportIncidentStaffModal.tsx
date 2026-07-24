import { AlertTriangle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Label } from '../ui/Label'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { useToast } from '../../contexts/ToastContext'
import { INCIDENT_TYPE_LABELS } from '../../api/incident.api'
import type { ApiBookingItem, ApiWashBay } from '../../types/api/staff'
import type { ReportBookingIncidentType } from '../../api/staffTasks.api'
import { useReportBookingIncident } from '../../hooks/api/staff/useStaffTasks'

interface ReportIncidentStaffModalProps {
  open: boolean
  bookingId: string
  /** Các service item để user chọn hạng mục bị ảnh hưởng (nếu cần). */
  bookingItems: ApiBookingItem[]
  /** Wash bay options cho incident WASH_BAY_FAILURE. */
  washBays: ApiWashBay[]
  /** Item key mặc định (vd item đang active khi user bấm báo sự cố). */
  defaultItemKey?: string
  onClose: () => void
  onReported?: (incidentId: string) => void
}

/**
 * Modal báo cáo sự cố từ staff task view — gọi qua
 * `useReportBookingIncident` → `POST /staff/tasks/:id/incidents`.
 *
 * BE `reportBookingIncidentSchema`:
 *  - `incident_type`: enum WASH_BAY_FAILURE | STAFF_UNAVAILABLE | OTHER_GARAGE_INCIDENT
 *  - `description`: required khi OTHER_GARAGE_INCIDENT
 *  - `affected_booking_item_key`: optional
 *  - `affected_wash_bay_id`: optional (BE check khi WASH_BAY_FAILURE)
 *
 * Phân quyền theo BE:
 *  - WASH_BAY_FAILURE → INCIDENT_REPORT_WASH_BAY_FAILURE (WASH_OPERATOR)
 *  - STAFF_UNAVAILABLE → INCIDENT_REPORT_STAFF_UNAVAILABLE
 *  - OTHER_GARAGE_INCIDENT → INCIDENT_REPORT_OTHER_GARAGE
 */
export function ReportIncidentStaffModal({
  open,
  bookingId,
  bookingItems,
  washBays,
  defaultItemKey,
  onClose,
  onReported,
}: ReportIncidentStaffModalProps) {
  const { showToast } = useToast()
  const reportIncident = useReportBookingIncident()

  const [incidentType, setIncidentType] =
    useState<ReportBookingIncidentType>('WASH_BAY_FAILURE')
  const [affectedItemKey, setAffectedItemKey] = useState<string>(
    defaultItemKey ?? '',
  )
  const [affectedWashBayId, setAffectedWashBayId] = useState<string>('')
  const [description, setDescription] = useState('')

  const requiresDescription = incidentType === 'OTHER_GARAGE_INCIDENT'
  const requiresWashBay = incidentType === 'WASH_BAY_FAILURE'
  const requiresItem = incidentType !== 'OTHER_GARAGE_INCIDENT'

  const itemOptions = useMemo(
    () =>
      bookingItems.map((item) => ({
        key: item.item_key,
        label: `#${item.sequence ?? 0} — ${item.name_snapshot}`,
      })),
    [bookingItems],
  )

  const reset = () => {
    setIncidentType('WASH_BAY_FAILURE')
    setAffectedItemKey(defaultItemKey ?? '')
    setAffectedWashBayId('')
    setDescription('')
  }

  const handleClose = () => {
    if (reportIncident.isPending) return
    reset()
    onClose()
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

    try {
      const result = await reportIncident.mutateAsync({
        bookingId,
        payload: {
          incident_type: incidentType,
          description: description.trim() || undefined,
          affected_booking_item_key: affectedItemKey || undefined,
          affected_wash_bay_id: affectedWashBayId || undefined,
        },
      })
      showToast(
        'Đã báo cáo sự cố. Hệ thống đang chờ khách hàng phản hồi.',
        'success',
      )
      // BE trả workflow với blocked_by_incident = true → `incidents[0]` tồn tại.
      onReported?.(String(result.booking_id ?? bookingId))
      reset()
      onClose()
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Không thể báo cáo sự cố.',
        'error',
      )
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Báo cáo sự cố"
      description="Booking sẽ tạm dừng (INCIDENT_HOLD) cho tới khi khách phản hồi."
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              Booking đã IN_PROGRESS — sự cố sẽ tạm dừng toàn bộ workflow,
              gửi thông báo cho khách. Chỉ báo cáo khi thực sự có sự cố.
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="staff-incident-type" required>
            Loại sự cố
          </Label>
          <Select
            id="staff-incident-type"
            value={incidentType}
            onChange={(event) =>
              setIncidentType(event.target.value as ReportBookingIncidentType)
            }
            disabled={reportIncident.isPending}
          >
            {(Object.keys(INCIDENT_TYPE_LABELS) as ReportBookingIncidentType[]).map(
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
            <Label htmlFor="staff-incident-item" required>
              Hạng mục dịch vụ bị ảnh hưởng
            </Label>
            <Select
              id="staff-incident-item"
              value={affectedItemKey}
              onChange={(event) => setAffectedItemKey(event.target.value)}
              disabled={reportIncident.isPending}
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
            <Label htmlFor="staff-incident-wash-bay" required>
              Buồng rửa bị sự cố
            </Label>
            <Select
              id="staff-incident-wash-bay"
              value={affectedWashBayId}
              onChange={(event) => setAffectedWashBayId(event.target.value)}
              disabled={reportIncident.isPending}
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
          <Label htmlFor="staff-incident-description" required={requiresDescription}>
            Mô tả {requiresDescription ? '' : '(tùy chọn)'}
          </Label>
          <textarea
            id="staff-incident-description"
            className="min-h-[100px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
            placeholder={
              requiresDescription
                ? 'Mô tả chi tiết sự cố…'
                : 'Thêm ghi chú cho sự cố…'
            }
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={reportIncident.isPending}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={reportIncident.isPending}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            disabled={reportIncident.isPending}
          >
            {reportIncident.isPending ? 'Đang báo cáo…' : 'Báo cáo sự cố'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
