import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useBookings } from '../../contexts/BookingContext'
import {
  walkInSchema,
  type WalkInFormValues,
} from '../../lib/validations/walkIn'
import type { WalkInBookingForm } from '../../types/booking'
import type { VehicleType } from '../../types/washBay'
import {
  getWalkInStartTime,
  type WalkInTimeSlotOption,
} from '../../utils/walkIn'
import { formatDateTime, formatPrice } from '../../utils/format'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { VEHICLE_TYPE_LABELS } from '../../constants/washBayStatus'

interface WalkInFormProps {
  onSubmit: (data: WalkInBookingForm) => Promise<void>
  isSubmitting?: boolean
  garage?: {
    name: string
    code?: string
  }
}

const TIME_SLOT_OPTIONS: Array<{
  value: WalkInTimeSlotOption
  label: string
}> = [
  { value: 'now', label: 'Ngay lập tức' },
  { value: 'plus30', label: '30 phút nữa' },
  { value: 'plus60', label: '1 giờ nữa' },
  { value: 'custom', label: 'Tùy chọn' },
]

export function WalkInForm({
  onSubmit,
  isSubmitting = false,
  garage,
}: WalkInFormProps) {
  const {
    getServicePackagesByVehicleType,
    setServicePackageVehicleType,
  } = useBookings()
  const [timeSlot, setTimeSlot] = useState<WalkInTimeSlotOption>('now')
  const [customTime, setCustomTime] = useState('')
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WalkInFormValues>({
    resolver: zodResolver(walkInSchema),
    defaultValues: {
      guest_name: '',
      guest_phone: '',
      guest_email: '',
      license_plate: '',
      vehicle_type: 'CAR',
      service_package_id: '',
      promotion_code: '',
      note: '',
    },
  })

  const vehicleType = watch('vehicle_type')

  /**
   * Quan trọng: phải đồng bộ vehicle_type với BookingContext để BE fetch
   * lại `/service-packages?vehicle_type=...`. Nếu không truyền filter,
   * BE mặc định chỉ trả về 1 gói MOTORBIKE ADDON → dropdown "Gói dịch vụ"
   * sẽ trống khi staff chọn "Xe máy" (xem scripts/test-api2.cjs).
   */
  useEffect(() => {
    if (vehicleType === 'CAR' || vehicleType === 'MOTORBIKE') {
      setServicePackageVehicleType(vehicleType)
    } else {
      setServicePackageVehicleType(null)
    }
  }, [vehicleType, setServicePackageVehicleType])

  /**
   * Khi unmount form, reset filter về null để các trang khác (vd.
   * WalkInForm khác, BookingList, ...) lấy được danh sách đầy đủ.
   */
  useEffect(() => {
    return () => {
      setServicePackageVehicleType(null)
    }
  }, [setServicePackageVehicleType])
  const servicePackageId = watch('service_package_id')

  const packages = useMemo(
    () =>
      getServicePackagesByVehicleType(vehicleType as VehicleType).filter(
        (pkg) => pkg.service_type !== 'ADDON',
      ),
    [getServicePackagesByVehicleType, vehicleType],
  )

  const addOnPackages = useMemo(
    () =>
      getServicePackagesByVehicleType(vehicleType as VehicleType).filter(
        (pkg) => pkg.service_type === 'ADDON',
      ),
    [getServicePackagesByVehicleType, vehicleType],
  )

  const selectedPackage = servicePackageId
    ? packages.find((pkg) => pkg.id === servicePackageId)
    : undefined

  /**
   * ID các dịch vụ đã có sẵn trong gói chính — dùng để disable add-on trùng.
   *  - Gói COMBO: lấy từ included_service_ids
   *  - Gói thường: chính gói đó (vì nếu add-on trùng gói chính cũng là duplicate)
   *  BE có thể trả string[] hoặc object[] { id, name } — luôn chuẩn hóa về string.
   */
  const includedInPrimaryPackage = useMemo(() => {
    if (!selectedPackage) return new Set<string>()
    if (selectedPackage.service_type === 'COMBO') {
      return new Set(
        (selectedPackage.included_service_ids ?? []).map((entry) => {
          if (typeof entry === 'string') return entry
          if (entry && typeof entry === 'object' && 'id' in entry) {
            return String((entry as { id: string }).id)
          }
          return ''
        }).filter(Boolean),
      )
    }
    return new Set([selectedPackage.id])
  }, [selectedPackage])

  useEffect(() => {
    if (
      servicePackageId &&
      !packages.some((pkg) => pkg.id === servicePackageId)
    ) {
      setValue('service_package_id', '')
    }
    setSelectedAddOnIds((current) =>
      current.filter(
        (id) =>
          addOnPackages.some((pkg) => pkg.id === id) &&
          !includedInPrimaryPackage.has(id),
      ),
    )
  }, [packages, addOnPackages, servicePackageId, setValue, includedInPrimaryPackage])

  /**
   * So khớp ID an toàn: chấp nhận cả string lẫn ObjectId (BE có thể trả ObjectId,
   * FE lưu string). Nếu DB chứa ObjectId, `===` thường sẽ miss → dùng `.toString()`.
   */
  const isAddOnConflictingWithPrimary = (addonId: string): boolean => {
    if (includedInPrimaryPackage.size === 0) return false
    if (includedInPrimaryPackage.has(addonId)) return true
    for (const included of includedInPrimaryPackage) {
      if (String(included) === String(addonId)) return true
    }
    return false
  }

  const previewStartTime = getWalkInStartTime(
    timeSlot,
    timeSlot === 'custom' ? customTime : undefined,
  )

  const handleFormSubmit = async (data: WalkInFormValues) => {
    if (timeSlot === 'custom' && !customTime) {
      return
    }

    const start_time =
      timeSlot === 'now'
        ? undefined
        : getWalkInStartTime(
            timeSlot,
            timeSlot === 'custom' ? customTime : undefined,
          ) ?? undefined

    if (timeSlot !== 'now' && !start_time) {
      return
    }

    // Defensive: loại bỏ add-on trùng với service đã có trong gói combo primary
    // trước khi gửi payload — tránh trường hợp BE trả lỗi DUPLICATE_SERVICE_ITEM.
    const safeAddOnIds = selectedAddOnIds.filter(
      (id) => !isAddOnConflictingWithPrimary(id),
    )

    await onSubmit({
      guest_name: data.guest_name,
      guest_phone: data.guest_phone,
      guest_email: data.guest_email?.trim() || '',
      license_plate: data.license_plate,
      vehicle_type: data.vehicle_type,
      service_package_id: data.service_package_id,
      serve_now: timeSlot === 'now',
      start_time,
      promotion_code: data.promotion_code?.trim() || undefined,
      add_on_service_ids:
        safeAddOnIds.length > 0 ? safeAddOnIds : undefined,
      note: data.note || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {garage ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Booking walk-in sẽ được tạo tại garage{' '}
          <strong>{garage.name}</strong>
          {garage.code ? (
            <span className="text-blue-700"> ({garage.code})</span>
          ) : null}
          .
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="guest_name" required>
            Họ và tên khách
          </Label>
          <Input
            id="guest_name"
            placeholder="Nguyễn Văn A"
            error={errors.guest_name?.message}
            {...register('guest_name')}
          />
        </div>

        <div>
          <Label htmlFor="guest_phone" required>
            Số điện thoại
          </Label>
          <Input
            id="guest_phone"
            type="tel"
            placeholder="0901234567"
            error={errors.guest_phone?.message}
            {...register('guest_phone')}
          />
        </div>

        <div>
          <Label htmlFor="guest_email">Email</Label>
          <Input
            id="guest_email"
            type="email"
            placeholder="email@example.com"
            error={errors.guest_email?.message}
            {...register('guest_email')}
          />
        </div>

        <div>
          <Label htmlFor="license_plate" required>
            Biển số
          </Label>
          <Input
            id="license_plate"
            placeholder="51G-123.45"
            error={errors.license_plate?.message}
            {...register('license_plate')}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="vehicle_type" required>
            Loại xe
          </Label>
          <Select id="vehicle_type" {...register('vehicle_type')}>
            <option value="CAR">{VEHICLE_TYPE_LABELS.CAR}</option>
            <option value="MOTORBIKE">{VEHICLE_TYPE_LABELS.MOTORBIKE}</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="service_package_id" required>
            Gói dịch vụ
          </Label>
          <Select
            id="service_package_id"
            error={errors.service_package_id?.message}
            {...register('service_package_id')}
          >
            <option value="">Chọn gói dịch vụ</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} — {formatPrice(pkg.base_price)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {addOnPackages.length > 0 ? (
        <div>
          <Label>Dịch vụ thêm (tùy chọn)</Label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {addOnPackages.map((pkg) => {
              const checked = selectedAddOnIds.includes(pkg.id)
              const isIncludedInPrimary = isAddOnConflictingWithPrimary(pkg.id)
              const disabled = isIncludedInPrimary
              return (
                <label
                  key={pkg.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors',
                    checked
                      ? 'border-brand-400 bg-brand-50'
                      : 'border-slate-200 bg-white hover:border-brand-200',
                    disabled && 'cursor-not-allowed opacity-60',
                  )}
                  title={
                    disabled
                      ? 'Dịch vụ này đã có sẵn trong gói đã chọn'
                      : undefined
                  }
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => {
                      if (disabled) return
                      setSelectedAddOnIds((current) =>
                        checked
                          ? current.filter((id) => id !== pkg.id)
                          : [...current, pkg.id],
                      )
                    }}
                  />
                  <span>
                    <span className="font-medium text-slate-900">
                      {pkg.name}
                      {disabled ? (
                        <span className="ml-2 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Đã có trong gói
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-slate-500">
                      {formatPrice(pkg.base_price)}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
          {selectedPackage?.service_type === 'COMBO' &&
          includedInPrimaryPackage.size > 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              Các dịch vụ đã có sẵn trong combo được tự động ẩn để tránh tạo
              booking trùng dịch vụ.
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <Label htmlFor="promotion_code">Mã khuyến mãi</Label>
        <Input
          id="promotion_code"
          placeholder="Nhập mã nếu có"
          error={errors.promotion_code?.message}
          {...register('promotion_code')}
        />
      </div>

      <div>
        <Label required>Thời gian</Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {TIME_SLOT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTimeSlot(option.value)}
              className={cn(
                'rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                timeSlot === option.value
                  ? 'border-brand-400 bg-brand-50 font-medium text-brand-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-brand-200',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {timeSlot === 'custom' ? (
          <div className="mt-3">
            <Input
              type="datetime-local"
              value={customTime}
              onChange={(event) => setCustomTime(event.target.value)}
            />
            {!customTime ? (
              <p className="mt-1.5 text-sm text-red-600">
                Vui lòng chọn thời gian tùy chỉnh
              </p>
            ) : null}
          </div>
        ) : timeSlot === 'now' ? (
          <p className="mt-2 text-sm text-slate-500">
            Phục vụ ngay — booking sẽ được tạo và tự động check-in.
          </p>
        ) : previewStartTime ? (
          <p className="mt-2 text-sm text-slate-500">
            Dự kiến: {formatDateTime(previewStartTime)} (khung 30 phút)
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="note">Ghi chú</Label>
        <Textarea
          id="note"
          placeholder="Yêu cầu đặc biệt của khách..."
          {...register('note')}
        />
      </div>

      {selectedPackage ? (
        <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-4">
          <p className="text-sm font-medium text-brand-900">Tóm tắt</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-brand-800">
            <span>{selectedPackage.name}</span>
            <span className="font-semibold">
              {formatPrice(selectedPackage.base_price)}
            </span>
          </div>
          <p className="mt-1 text-xs text-brand-700">
            Walk-in được tạo qua API và tự động chuyển sang trạng thái{' '}
            <strong>Đã check-in</strong>.
          </p>
        </div>
      ) : null}

      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tạo booking...
          </>
        ) : (
          'Tạo lịch đặt'
        )}
      </Button>
    </form>
  )
}
