import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  getServicePackageById,
  getServicePackagesByVehicleType,
} from '../../mocks/servicePackages'
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

export function WalkInForm({ onSubmit, isSubmitting = false }: WalkInFormProps) {
  const [timeSlot, setTimeSlot] = useState<WalkInTimeSlotOption>('now')
  const [customTime, setCustomTime] = useState('')

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
      start_time: getWalkInStartTime('now'),
      note: '',
    },
  })

  const vehicleType = watch('vehicle_type')
  const servicePackageId = watch('service_package_id')

  const packages = useMemo(
    () => getServicePackagesByVehicleType(vehicleType as VehicleType),
    [vehicleType],
  )

  const selectedPackage = servicePackageId
    ? getServicePackageById(servicePackageId)
    : undefined

  useEffect(() => {
    if (
      servicePackageId &&
      !packages.some((pkg) => pkg.id === servicePackageId)
    ) {
      setValue('service_package_id', '')
    }
  }, [packages, servicePackageId, setValue])

  const previewStartTime = getWalkInStartTime(
    timeSlot,
    timeSlot === 'custom' ? customTime : undefined,
  )

  const handleFormSubmit = async (data: WalkInFormValues) => {
    const start_time = getWalkInStartTime(
      timeSlot,
      timeSlot === 'custom' ? customTime : undefined,
    )

    if (timeSlot === 'custom' && !customTime) {
      return
    }

    await onSubmit({
      guest_name: data.guest_name,
      guest_phone: data.guest_phone,
      guest_email: data.guest_email || undefined,
      license_plate: data.license_plate,
      vehicle_type: data.vehicle_type,
      service_package_id: data.service_package_id,
      start_time,
      note: data.note || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
                  ? 'border-blue-400 bg-blue-50 font-medium text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200',
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
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            Dự kiến: {formatDateTime(previewStartTime)}
          </p>
        )}
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
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">
          <p className="text-sm font-medium text-blue-900">Tóm tắt</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-blue-800">
            <span>{selectedPackage.name}</span>
            <span className="font-semibold">
              {formatPrice(selectedPackage.base_price)}
            </span>
          </div>
          <p className="mt-1 text-xs text-blue-600">
            Walk-in sẽ được tạo với trạng thái{' '}
            <strong>Đã check-in</strong> (mock)
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
          'Tạo walk-in booking'
        )}
      </Button>
    </form>
  )
}
