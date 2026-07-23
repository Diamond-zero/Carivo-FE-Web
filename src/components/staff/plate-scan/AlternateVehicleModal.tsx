// ============================================================================
// AlternateVehicleModal — staff gửi yêu cầu dùng xe thay thế / khác để admin
// duyệt (PATCH /admin/booking-arrivals/plate-scans/{scanId}/alternate-vehicle).
//
// Phase 2.8: BE `bookingArrival.validator.alternateVehicleSchema`:
//   required: license_plate (4–30), vehicle_type (CAR|MOTORBIKE), reason (5–1000)
//   optional: brand (≤80), model (≤80), color (≤50)
//
// Sau khi admin APPROVE → staff có thể confirm booking mà KHÔNG cần override_reason.
// ============================================================================

import { AlertTriangle, Loader2, Truck, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  ALTERNATE_VEHICLE_STATUS_LABELS,
} from '../../../api/plateScan.api'
import { Button } from '../../ui/Button'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import type {
  ApiRequestAlternateVehiclePayload,
  AlternateVehicleStatus,
  PlateScanVehicleType,
} from '../../../types/api/plateScan'

const VEHICLE_TYPES: Array<{ value: PlateScanVehicleType; label: string }> = [
  { value: 'CAR', label: 'Ô tô' },
  { value: 'MOTORBIKE', label: 'Xe máy' },
]

const MIN_REASON_LENGTH = 5
const MAX_REASON_LENGTH = 1000
const MIN_PLATE_LENGTH = 4
const MAX_PLATE_LENGTH = 30
const MAX_BRAND_LENGTH = 80
const MAX_MODEL_LENGTH = 80
const MAX_COLOR_LENGTH = 50

interface Props {
  open: boolean
  scanLabel: string
  /** Trạng thái alternate vehicle hiện tại (NONE / REQUESTED / APPROVED / REJECTED). */
  currentStatus: AlternateVehicleStatus
  onClose: () => void
  onSubmit: (payload: ApiRequestAlternateVehiclePayload) => void
  isSubmitting: boolean
}

const normalizeLicensePlate = (value: string): string =>
  value.toUpperCase().replace(/\s+/g, ' ').trim()

export function AlternateVehicleModal({
  open,
  scanLabel,
  currentStatus,
  onClose,
  onSubmit,
  isSubmitting,
}: Props) {
  const [licensePlate, setLicensePlate] = useState('')
  const [vehicleType, setVehicleType] = useState<PlateScanVehicleType>('CAR')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [color, setColor] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) {
      setLicensePlate('')
      setVehicleType('CAR')
      setBrand('')
      setModel('')
      setColor('')
      setReason('')
    }
  }, [open])

  const trimmedPlate = normalizeLicensePlate(licensePlate)
  const trimmedReason = reason.trim()
  const plateValid =
    trimmedPlate.length >= MIN_PLATE_LENGTH &&
    trimmedPlate.length <= MAX_PLATE_LENGTH
  const reasonValid =
    trimmedReason.length >= MIN_REASON_LENGTH &&
    trimmedReason.length <= MAX_REASON_LENGTH
  const brandValid = brand.length <= MAX_BRAND_LENGTH
  const modelValid = model.length <= MAX_MODEL_LENGTH
  const colorValid = color.length <= MAX_COLOR_LENGTH

  const isValid = plateValid && reasonValid && brandValid && modelValid && colorValid

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid || isSubmitting) return
    const payload: ApiRequestAlternateVehiclePayload = {
      license_plate: trimmedPlate,
      vehicle_type: vehicleType === 'UNKNOWN' ? 'CAR' : vehicleType,
      reason: trimmedReason,
    }
    if (brand.trim()) payload.brand = brand.trim()
    if (model.trim()) payload.model = model.trim()
    if (color.trim()) payload.color = color.trim()
    onSubmit(payload)
  }

  return (
    <Modal open={open} onClose={onClose} title="Yêu cầu dùng xe thay thế">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-900">
          <p className="flex items-start gap-2 font-semibold">
            <Truck className="mt-0.5 h-4 w-4 shrink-0" />
            Yêu cầu sẽ được gửi tới admin để duyệt.
          </p>
          <p className="mt-1.5 text-xs text-amber-800">
            Sau khi admin duyệt, staff có thể xác nhận check-in mà không cần ghi
            override reason. Trạng thái hiện tại:{' '}
            <strong>
              {ALTERNATE_VEHICLE_STATUS_LABELS[currentStatus] ?? currentStatus}
            </strong>{' '}
            · biển số đang xét <span className="font-mono">{scanLabel}</span>.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="alt-plate">
              Biển số xe thay thế * ({MIN_PLATE_LENGTH}–{MAX_PLATE_LENGTH} ký tự)
            </Label>
            <input
              id="alt-plate"
              type="text"
              placeholder="VD: 51A-123.45"
              maxLength={MAX_PLATE_LENGTH}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 font-mono text-sm uppercase shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
              value={licensePlate}
              onChange={(event) => setLicensePlate(event.target.value)}
              disabled={isSubmitting}
              required
            />
            {licensePlate && !plateValid ? (
              <p className="mt-1 text-xs text-amber-700">
                Biển số phải từ {MIN_PLATE_LENGTH}–{MAX_PLATE_LENGTH} ký tự.
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="alt-type">Loại xe *</Label>
            <select
              id="alt-type"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
              value={vehicleType}
              onChange={(event) =>
                setVehicleType(event.target.value as PlateScanVehicleType)
              }
              disabled={isSubmitting}
              required
            >
              {VEHICLE_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="alt-color">
              Màu xe (optional, ≤{MAX_COLOR_LENGTH})
            </Label>
            <input
              id="alt-color"
              type="text"
              maxLength={MAX_COLOR_LENGTH}
              placeholder="VD: Đen"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="alt-brand">
              Hãng (optional, ≤{MAX_BRAND_LENGTH})
            </Label>
            <input
              id="alt-brand"
              type="text"
              maxLength={MAX_BRAND_LENGTH}
              placeholder="VD: Toyota"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="alt-model">
              Model (optional, ≤{MAX_MODEL_LENGTH})
            </Label>
            <input
              id="alt-model"
              type="text"
              maxLength={MAX_MODEL_LENGTH}
              placeholder="VD: Vios"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="alt-reason">
              Lý do * ({MIN_REASON_LENGTH}–{MAX_REASON_LENGTH} ký tự)
            </Label>
            <textarea
              id="alt-reason"
              rows={3}
              maxLength={MAX_REASON_LENGTH}
              placeholder="VD: Khách mang xe khác đến vì xe chính đang bảo dưỡng. Cần admin duyệt nhanh để staff check-in được."
              className="mt-2 min-h-[80px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={isSubmitting}
              required
            />
            <p className="mt-1 flex items-center justify-between text-xs">
              <span
                className={
                  !reason
                    ? 'text-slate-500'
                    : reasonValid
                      ? 'text-green-700'
                      : 'text-amber-700'
                }
              >
                {trimmedReason.length}/{MAX_REASON_LENGTH} ký tự
              </span>
              {!reasonValid && reason ? (
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  Cần tối thiểu {MIN_REASON_LENGTH} ký tự.
                </span>
              ) : null}
            </p>
          </div>
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
          <Button type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Truck className="h-4 w-4" />
            )}
            Gửi yêu cầu xe thay thế
          </Button>
        </div>
      </form>
    </Modal>
  )
}