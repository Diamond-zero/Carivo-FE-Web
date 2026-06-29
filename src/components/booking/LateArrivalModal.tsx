import { AlertTriangle, CalendarClock, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Booking } from '../../types/booking'
import type {
  ApiLateArrivalOptions,
  ApiLateArrivalSuggestedSlot,
} from '../../types/api/staff'
import type { LateArrivalResolution } from '../../types/api/staff'
import { getBookingCustomerName } from '../../utils/booking'
import { formatDateTime, formatTime } from '../../utils/format'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface LateArrivalModalProps {
  open: boolean
  onClose: () => void
  booking: Booking
  lateMinutes: number
  options: ApiLateArrivalOptions | null
  isLoadingOptions: boolean
  loadError: string | null
  onReloadOptions: () => Promise<ApiLateArrivalOptions | undefined>
  onResolve: (
    resolution: LateArrivalResolution,
    payload?: { new_start_time?: string | null; note?: string },
  ) => Promise<{ success: boolean; message: string }>
}

type Mode = 'keep' | 'reschedule'

export function LateArrivalModal({
  open,
  onClose,
  booking,
  lateMinutes,
  options,
  isLoadingOptions,
  loadError,
  onReloadOptions,
  onResolve,
}: LateArrivalModalProps) {
  const [mode, setMode] = useState<Mode>('keep')
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slots: ApiLateArrivalSuggestedSlot[] = useMemo(
    () => options?.suggested_slots ?? [],
    [options?.suggested_slots],
  )

  useEffect(() => {
    if (!open) {
      setError(null)
      setIsSubmitting(false)
      setMode('keep')
      setSelectedSlotKey(null)
    }
  }, [open])

  useEffect(() => {
    if (open && slots.length > 0 && !selectedSlotKey) {
      const firstAvailable = slots.find((s) => s.is_available) ?? slots[0]
      setSelectedSlotKey(`${firstAvailable.start_time}`)
    }
  }, [open, slots, selectedSlotKey])

  const handleConfirm = async () => {
    setError(null)

    if (mode === 'keep') {
      setIsSubmitting(true)
      const result = await onResolve('ACCEPT_WITHIN_ORIGINAL_WINDOW', {
        note: `Khách đến muộn ${lateMinutes} phút — chấp nhận giữ khung giờ gốc.`,
      })
      setIsSubmitting(false)
      if (!result.success) {
        setError(result.message)
        return
      }
      onClose()
      return
    }

    const slot = slots.find((s) => `${s.start_time}` === selectedSlotKey)
    if (!slot) {
      setError('Vui lòng chọn khung giờ mới.')
      return
    }
    if (!slot.is_available) {
      setError(slot.unavailable_reasons?.join(', ') ?? 'Khung giờ không khả dụng.')
      return
    }

    setIsSubmitting(true)
    const result = await onResolve('RESCHEDULED', {
      new_start_time: slot.start_time,
      note: `Khách đến muộn ${lateMinutes} phút — đổi sang ${formatDateTime(slot.start_time)}.`,
    })
    setIsSubmitting(false)
    if (!result.success) {
      setError(result.message)
      return
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (isSubmitting) return
        onClose()
      }}
      title="Khách đến muộn"
      description="Booking chưa được check-in hoàn tất. Chọn cách xử lý đến trễ để tiếp tục."
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Khách đến muộn {lateMinutes} phút</p>
            <p className="mt-0.5 text-xs text-amber-700">
              Booking {booking.id.replace('booking-', '#')} ·{' '}
              {getBookingCustomerName(booking)} · {booking.license_plate}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(['keep', 'reschedule'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={cn(
                'rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                mode === option
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
              )}
            >
              <p className="font-semibold">
                {option === 'keep' ? 'Giữ khung giờ gốc' : 'Đổi lịch'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {option === 'keep'
                  ? 'Vẫn thực hiện trong khung giờ đã đặt (cắt bớt phần đã trễ).'
                  : 'Chọn khung giờ mới trong danh sách BE gợi ý.'}
              </p>
            </button>
          ))}
        </div>

        {mode === 'reschedule' ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Khung giờ gợi ý</p>
              <button
                type="button"
                onClick={() => void onReloadOptions()}
                disabled={isLoadingOptions}
                className="text-xs font-semibold text-brand-700 hover:underline disabled:opacity-50"
              >
                {isLoadingOptions ? 'Đang tải...' : 'Tải lại'}
              </button>
            </div>

            {isLoadingOptions ? (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải khung giờ gợi ý...
              </p>
            ) : loadError ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {loadError}
              </p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có khung giờ gợi ý.</p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {slots.map((slot) => {
                  const key = `${slot.start_time}`
                  const unavailable = !slot.is_available
                  return (
                    <label
                      key={key}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm transition-colors',
                        selectedSlotKey === key
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-slate-200 hover:border-slate-300',
                        unavailable && 'cursor-not-allowed opacity-60',
                      )}
                    >
                      <input
                        type="radio"
                        name="late-slot"
                        value={key}
                        disabled={unavailable}
                        checked={selectedSlotKey === key}
                        onChange={() => setSelectedSlotKey(key)}
                        className="mt-0.5 h-4 w-4 accent-brand-600"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">
                          {formatDateTime(slot.start_time)} – {formatTime(slot.end_time)}
                        </p>
                        {unavailable ? (
                          <p className="text-xs text-red-600">
                            Không khả dụng — {slot.unavailable_reasons?.join(', ') ?? 'vui lòng chọn khung khác'}
                          </p>
                        ) : (
                          <p className="text-xs text-emerald-700">Khả dụng</p>
                        )}
                      </div>
                      <CalendarClock className="h-4 w-4 shrink-0 text-slate-400" />
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        ) : null}

        <div className="flex gap-3 pt-1">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            fullWidth
            onClick={handleConfirm}
            disabled={isSubmitting || (mode === 'reschedule' && !selectedSlotKey)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : mode === 'keep' ? (
              'Xác nhận giữ giờ gốc'
            ) : (
              'Xác nhận đổi lịch'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}