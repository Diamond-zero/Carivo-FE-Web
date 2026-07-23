// ============================================================================
// RejectScanModal — staff chọn lý do enum (6 giá trị) + note optional.
// Phase 2.7: tách từ inline form trong StaffPlateScanDetailPage.
// ============================================================================

import { Loader2, ShieldX, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { PLATE_SCAN_REJECTION_REASON_LABELS } from '../../../api/plateScan.api'
import { Button } from '../../ui/Button'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import type {
  ApiRejectPlateScanPayload,
  PlateScanRejectionReason,
} from '../../../types/api/plateScan'

const REASONS = Object.keys(
  PLATE_SCAN_REJECTION_REASON_LABELS,
) as PlateScanRejectionReason[]

const MAX_NOTE_LENGTH = 1000

interface Props {
  open: boolean
  scanLabel: string
  onClose: () => void
  onConfirm: (payload: ApiRejectPlateScanPayload) => void
  isSubmitting: boolean
}

export function RejectScanModal({
  open,
  scanLabel,
  onClose,
  onConfirm,
  isSubmitting,
}: Props) {
  const [reason, setReason] = useState<PlateScanRejectionReason | ''>('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setReason('')
      setNote('')
    }
  }, [open])

  const isValid = reason !== ''

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid || isSubmitting) return
    const payload: ApiRejectPlateScanPayload = { reason }
    if (note.trim()) payload.note = note.trim()
    onConfirm(payload)
  }

  return (
    <Modal open={open} onClose={onClose} title="Từ chối lượt quét">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 text-sm text-red-900">
          <p className="flex items-start gap-2 font-semibold">
            <ShieldX className="mt-0.5 h-4 w-4 shrink-0" />
            Lượt quét này sẽ bị đánh dấu REJECTED.
          </p>
          <p className="mt-1.5 text-xs text-red-800">
            Biển số <span className="font-mono font-bold">{scanLabel}</span> sẽ
            không được ghép với bất kỳ booking nào. Staff có thể gửi yêu cầu xe
            thay thế thay thế.
          </p>
        </div>

        <div>
          <Label htmlFor="reject-reason">Lý do *</Label>
          <select
            id="reject-reason"
            className="mt-2 h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
            value={reason}
            onChange={(event) =>
              setReason(event.target.value as PlateScanRejectionReason | '')
            }
            disabled={isSubmitting}
            required
          >
            <option value="">— Chọn lý do —</option>
            {REASONS.map((key) => (
              <option key={key} value={key}>
                {PLATE_SCAN_REJECTION_REASON_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="reject-note">
            Ghi chú (optional, tối đa {MAX_NOTE_LENGTH} ký tự)
          </Label>
          <textarea
            id="reject-note"
            rows={3}
            maxLength={MAX_NOTE_LENGTH}
            placeholder="VD: Khách đến sai giờ / sai garage, đã điều hướng sang quầy lễ tân."
            className="mt-2 min-h-[80px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={isSubmitting}
          />
          <p className="mt-1 text-right text-xs text-slate-500">
            {note.length}/{MAX_NOTE_LENGTH}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
            Hủy
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldX className="h-4 w-4" />
            )}
            Xác nhận từ chối
          </Button>
        </div>
      </form>
    </Modal>
  )
}