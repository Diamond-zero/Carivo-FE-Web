import { AlertTriangle, Ban, Clock, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { Booking } from '../../types/booking'
import type { ApiLateArrivalSuggestedSlot } from '../../types/api/staff'
import {
  getCancelBookingGuard,
  getLateArrivalGuard,
  getMarkNoShowGuard,
} from '../../utils/bookingActionGuards'
import { formatDateTime } from '../../utils/format'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Modal } from '../ui/Modal'
import { Textarea } from '../ui/Textarea'
import { GuardedActionButton } from './GuardedActionButton'

interface BookingExceptionActionsProps {
  booking: Booking
  staffGarageId?: string
  onCancel: (reason?: string) => Promise<{ success: boolean; message: string }>
  onMarkNoShow: (reason?: string) => Promise<{ success: boolean; message: string }>
  onLoadLateOptions: () => Promise<import('../../types/api/staff').ApiLateArrivalOptions>
  onResolveLateArrival: (
    resolution: 'ACCEPT_WITHIN_ORIGINAL_WINDOW' | 'RESCHEDULED',
    newStartTime?: string,
    note?: string,
  ) => Promise<{ success: boolean; message: string }>
}

export function BookingExceptionActions({
  booking,
  staffGarageId,
  onCancel,
  onMarkNoShow,
  onLoadLateOptions,
  onResolveLateArrival,
}: BookingExceptionActionsProps) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const [noShowOpen, setNoShowOpen] = useState(false)
  const [lateOpen, setLateOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [noShowReason, setNoShowReason] = useState('')
  const [lateNote, setLateNote] = useState('')
  const [lateSlots, setLateSlots] = useState<ApiLateArrivalSuggestedSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cancelGuard = getCancelBookingGuard(booking, staffGarageId)
  const noShowGuard = getMarkNoShowGuard(booking, staffGarageId)
  const lateGuard = getLateArrivalGuard(booking, staffGarageId)

  const openLateModal = async () => {
    setError(null)
    setLateOpen(true)
    setIsSubmitting(true)
    try {
      const options = await onLoadLateOptions()
      setLateSlots(options.suggested_slots.filter((slot) => slot.is_available))
      setSelectedSlot(
        options.suggested_slots.find((slot) => slot.is_available)?.start_time ?? '',
      )
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Không thể tải slot gợi ý.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    setIsSubmitting(true)
    setError(null)
    const result = await onCancel(cancelReason.trim() || undefined)
    setIsSubmitting(false)
    if (result.success) {
      setCancelOpen(false)
      return
    }
    setError(result.message)
  }

  const handleNoShow = async () => {
    setIsSubmitting(true)
    setError(null)
    const result = await onMarkNoShow(noShowReason.trim() || undefined)
    setIsSubmitting(false)
    if (result.success) {
      setNoShowOpen(false)
      return
    }
    setError(result.message)
  }

  const handleAcceptLate = async () => {
    setIsSubmitting(true)
    setError(null)
    const result = await onResolveLateArrival(
      'ACCEPT_WITHIN_ORIGINAL_WINDOW',
      undefined,
      lateNote.trim() || undefined,
    )
    setIsSubmitting(false)
    if (result.success) {
      setLateOpen(false)
      return
    }
    setError(result.message)
  }

  const handleRescheduleLate = async () => {
    if (!selectedSlot) {
      setError('Vui lòng chọn slot mới.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    const result = await onResolveLateArrival(
      'RESCHEDULED',
      selectedSlot,
      lateNote.trim() || undefined,
    )
    setIsSubmitting(false)
    if (result.success) {
      setLateOpen(false)
      return
    }
    setError(result.message)
  }

  const hasAnyAction =
    cancelGuard.allowed || noShowGuard.allowed || lateGuard.allowed

  if (!hasAnyAction) return null

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {cancelGuard.allowed ? (
          <Button variant="secondary" size="sm" onClick={() => setCancelOpen(true)}>
            <Ban className="h-4 w-4" />
            Hủy booking
          </Button>
        ) : null}
        {noShowGuard.allowed ? (
          <Button variant="secondary" size="sm" onClick={() => setNoShowOpen(true)}>
            <AlertTriangle className="h-4 w-4" />
            No-show
          </Button>
        ) : null}
        {lateGuard.allowed ? (
          <Button variant="secondary" size="sm" onClick={() => void openLateModal()}>
            <Clock className="h-4 w-4" />
            Xử lý đến trễ
          </Button>
        ) : null}
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Hủy booking"
        description="Ghi lý do hủy (tuỳ chọn) và xác nhận."
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="cancel-reason">Lý do hủy</Label>
            <Textarea
              id="cancel-reason"
              className="mt-1.5"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setCancelOpen(false)}>
              Đóng
            </Button>
            <Button fullWidth onClick={handleCancel} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Xác nhận hủy'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={noShowOpen}
        onClose={() => setNoShowOpen(false)}
        title="Đánh dấu no-show"
        description="Khách không đến theo lịch đã xác nhận."
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="noshow-reason">Lý do</Label>
            <Textarea
              id="noshow-reason"
              className="mt-1.5"
              value={noShowReason}
              onChange={(event) => setNoShowReason(event.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setNoShowOpen(false)}>
              Đóng
            </Button>
            <Button fullWidth onClick={handleNoShow} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Xác nhận'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={lateOpen}
        onClose={() => setLateOpen(false)}
        title="Xử lý khách đến trễ"
        description="Chấp nhận trong khung giờ cũ hoặc đổi sang slot gợi ý."
      >
        <div className="space-y-4">
          {isSubmitting && lateSlots.length === 0 ? (
            <p className="text-sm text-slate-500">Đang tải slot gợi ý...</p>
          ) : null}

          {lateSlots.length > 0 ? (
            <div className="space-y-2">
              <Label>Slot gợi ý</Label>
              {lateSlots.map((slot) => (
                <button
                  key={slot.start_time}
                  type="button"
                  onClick={() => setSelectedSlot(slot.start_time)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm ${
                    selectedSlot === slot.start_time
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200'
                  }`}
                >
                  {formatDateTime(slot.start_time)}
                </button>
              ))}
            </div>
          ) : null}

          <div>
            <Label htmlFor="late-note">Ghi chú</Label>
            <Input
              id="late-note"
              className="mt-1.5"
              value={lateNote}
              onChange={(event) => setLateNote(event.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex flex-col gap-2">
            <GuardedActionButton
              guard={{ allowed: true }}
              fullWidth
              disabled={isSubmitting}
              onClick={handleAcceptLate}
            >
              Chấp nhận trong khung cũ
            </GuardedActionButton>
            <Button
              fullWidth
              variant="secondary"
              disabled={isSubmitting || !selectedSlot}
              onClick={handleRescheduleLate}
            >
              Đổi sang slot đã chọn
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
