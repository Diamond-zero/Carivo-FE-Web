import { Car, Bike, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  VEHICLE_TYPE_LABELS,
  WASH_BAY_STATUS_LABELS,
} from '../../constants/washBayStatus'
import { cn } from '../../lib/utils'
import type { Booking } from '../../types/booking'
import type { WashBay } from '../../types/washBay'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface AssignWashBayModalProps {
  open: boolean
  onClose: () => void
  booking: Booking
  availableBays: WashBay[]
  onAssign: (
    washBayId: string,
  ) => Promise<{ success: boolean; message: string }>
}

export function AssignWashBayModal({
  open,
  onClose,
  booking,
  availableBays,
  onAssign,
}: AssignWashBayModalProps) {
  const [selectedBayId, setSelectedBayId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelectedBayId(availableBays[0]?.id ?? '')
      setError(null)
    }
  }, [open, availableBays])

  const handleAssign = async () => {
    if (!selectedBayId) {
      setError('Vui lòng chọn buồng rửa.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    await new Promise((resolve) => setTimeout(resolve, 400))

    const result = await onAssign(selectedBayId)
    setIsSubmitting(false)

    if (result.success) {
      onClose()
      return
    }

    setError(result.message)
  }

  const VehicleIcon = booking.vehicle_type === 'CAR' ? Car : Bike

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gán buồng rửa"
      description={`Chọn buồng ${VEHICLE_TYPE_LABELS[booking.vehicle_type].toLowerCase()} trống cho booking ${booking.id.replace('booking-', '#')} · ${booking.license_plate}`}
    >
      {availableBays.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Không có buồng rửa{' '}
            {VEHICLE_TYPE_LABELS[booking.vehicle_type].toLowerCase()} nào đang
            trống. Vui lòng đợi buồng khác hoàn thành hoặc kiểm tra trạng thái
            trên Dashboard.
          </div>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Đóng
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <VehicleIcon className="h-4 w-4 text-slate-500" />
            <span className="text-slate-600">
              Loại xe:{' '}
              <span className="font-medium text-slate-900">
                {VEHICLE_TYPE_LABELS[booking.vehicle_type]}
              </span>
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              Buồng rửa khả dụng ({availableBays.length})
            </p>
            <ul className="space-y-2">
              {availableBays.map((bay) => {
                const isSelected = selectedBayId === bay.id

                return (
                  <li key={bay.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedBayId(bay.id)}
                      className={cn(
                        'w-full rounded-xl border px-4 py-3 text-left transition-colors',
                        isSelected
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            {bay.name}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {bay.bay_code}
                          </p>
                        </div>
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          {WASH_BAY_STATUS_LABELS.AVAILABLE}
                        </span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
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
            <Button fullWidth onClick={handleAssign} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang gán...
                </>
              ) : (
                'Xác nhận gán'
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
