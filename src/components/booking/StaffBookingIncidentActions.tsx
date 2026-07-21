import { AlertTriangle, Gift, Siren } from 'lucide-react'
import { useState } from 'react'
import { CompensationVoucherModal } from '../admin/booking/CompensationVoucherModal'
import { IncidentReportModal } from '../admin/booking/IncidentReportModal'
import { IncidentResolutionModal } from '../admin/booking/IncidentResolutionModal'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { useToast } from '../../contexts/ToastContext'
import { INCIDENT_TYPE_LABELS } from '../../api/incident.api'
import type { ApiBookingItem, ApiWashBay } from '../../types/api/staff'
import type { Booking } from '../../types/booking'

interface StaffBookingIncidentActionsProps {
  booking: Booking
  bookingItems?: ApiBookingItem[]
  washBays?: ApiWashBay[]
  servicePackages?: Array<{ id: string; name: string; base_price: number }>
  onChanged: () => void
}

/**
 * Block "Sự cố" cho staff booking detail.
 *
 * - Nếu không có incident: hiển thị nút "Báo cáo sự cố" (chỉ khi booking đang
 *   active — không cho incident khi COMPLETED/CANCELED/NO_SHOW).
 * - Nếu có active_incident: banner cảnh báo + nút "Ghi nhận quyết định khách".
 * - Sau khi incident RESOLVED + booking cần compensation: nút "Phát voucher bồi thường".
 *
 * 3 modal (IncidentReport / IncidentResolution / CompensationVoucher) tự gọi
 * API bên trong và chỉ báo lại qua `onReported` / `onResolved` / `onIssued`.
 */
export function StaffBookingIncidentActions({
  booking,
  bookingItems = [],
  washBays = [],
  servicePackages = [],
  onChanged,
}: StaffBookingIncidentActionsProps) {
  const { showToast } = useToast()
  const [reportOpen, setReportOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [voucherOpen, setVoucherOpen] = useState(false)

  const activeIncident = booking.active_incident ?? null

  const reportableStatuses = ['CHECKED_IN', 'IN_PROGRESS', 'AWAITING_CUSTOMER_DECISION']
  const canReport = reportableStatuses.includes(booking.status) && !activeIncident

  const canIssueVoucher =
    activeIncident?.status === 'RESOLVED' && booking.status === 'COMPLETED'

  const incidentTypeLabel =
    INCIDENT_TYPE_LABELS[
      activeIncident?.incident_type as keyof typeof INCIDENT_TYPE_LABELS
    ] ?? activeIncident?.incident_type

  return (
    <div className="space-y-3">
      {activeIncident ? (
        <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-amber-900">
                Đang chờ khách phản hồi sự cố
              </p>
              <Badge variant="warning">{incidentTypeLabel}</Badge>
            </div>
            {activeIncident.description ? (
              <p className="mt-1 text-sm text-amber-800">
                {activeIncident.description}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {activeIncident.status === 'AWAITING_CUSTOMER_DECISION' ? (
                <Button size="sm" onClick={() => setResolveOpen(true)}>
                  <Siren className="h-4 w-4" />
                  Ghi nhận quyết định khách
                </Button>
              ) : null}
              {canIssueVoucher ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setVoucherOpen(true)}
                >
                  <Gift className="h-4 w-4" />
                  Phát voucher bồi thường
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {canReport ? (
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => setReportOpen(true)}>
            <Siren className="h-4 w-4" />
            Báo cáo sự cố
          </Button>
        </div>
      ) : null}

      <IncidentReportModal
        open={reportOpen}
        bookingId={booking.id}
        bookingItems={bookingItems}
        washBays={washBays}
        onClose={() => setReportOpen(false)}
        onReported={() => {
          setReportOpen(false)
          showToast(
            'Đã báo cáo sự cố. Hệ thống đang chờ khách hàng phản hồi.',
            'success',
          )
          onChanged()
        }}
      />

      {activeIncident ? (
        <IncidentResolutionModal
          open={resolveOpen}
          bookingId={booking.id}
          incidentId={activeIncident.id}
          onClose={() => setResolveOpen(false)}
          onResolved={() => {
            setResolveOpen(false)
            onChanged()
          }}
        />
      ) : null}

      {activeIncident ? (
        <CompensationVoucherModal
          open={voucherOpen}
          bookingId={booking.id}
          incidentId={activeIncident.id}
          servicePackages={servicePackages}
          onClose={() => setVoucherOpen(false)}
          onIssued={(_voucherId, requiresApproval) => {
            setVoucherOpen(false)
            showToast(
              requiresApproval
                ? 'Đã gửi yêu cầu phát voucher — chờ admin duyệt.'
                : 'Đã phát voucher bồi thường cho khách.',
              'success',
            )
            onChanged()
          }}
        />
      ) : null}
    </div>
  )
}