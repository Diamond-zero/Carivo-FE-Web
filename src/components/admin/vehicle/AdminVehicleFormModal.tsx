import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAllAdminCustomers } from '../../../hooks/api/admin/useAdminCustomers'
import {
  adminVehicleCreateSchema,
  type AdminVehicleCreateValues,
  type VehicleFormValues,
} from '../../../lib/validations/adminVehicle'
import type { Vehicle } from '../../../types/vehicle'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import { Select } from '../../ui/Select'

const CAR_BODY_LABELS: Record<string, string> = {
  HATCHBACK: 'Hatchback',
  SEDAN: 'Sedan',
  SUV: 'SUV',
  MPV: 'MPV',
  PICKUP: 'Pickup',
  VAN: 'Van',
}

const CC_GROUP_LABELS: Record<string, string> = {
  UNDER_175CC: 'Dưới 175cc',
  OVER_175CC: 'Từ 175cc trở lên',
}

const ENGINE_LABELS: Record<string, string> = {
  GASOLINE: 'Xăng',
  ELECTRIC: 'Điện',
}

interface AdminVehicleFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  initialVehicle?: Vehicle
  fixedCustomerId?: string
  onClose: () => void
  onSubmit: (values: VehicleFormValues | AdminVehicleCreateValues) => Promise<void>
  isSubmitting?: boolean
}

export function AdminVehicleFormModal({
  open,
  mode,
  initialVehicle,
  fixedCustomerId,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AdminVehicleFormModalProps) {
  const { allCustomers } = useAllAdminCustomers()

  const form = useForm<AdminVehicleCreateValues>({
    resolver: zodResolver(adminVehicleCreateSchema),
    defaultValues: {
      customer_id: fixedCustomerId ?? '',
      raw_license_plate: '',
      vehicle_type: 'CAR',
      engine_type: 'GASOLINE',
      motorbike_cc_group: null,
      car_body_type: 'SEDAN',
      seat_count: 4,
      brand: '',
      model: '',
      color: '',
      is_default: false,
      is_active: true,
    },
  })

  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      form.reset({
        customer_id: fixedCustomerId ?? allCustomers[0]?.id ?? '',
        raw_license_plate: '',
        vehicle_type: 'CAR',
        engine_type: 'GASOLINE',
        motorbike_cc_group: null,
        car_body_type: 'SEDAN',
        seat_count: 4,
        brand: '',
        model: '',
        color: '',
        is_default: false,
        is_active: true,
      })
      return
    }

    if (initialVehicle) {
      form.reset({
        customer_id: initialVehicle.customer_id,
        raw_license_plate: initialVehicle.raw_license_plate,
        vehicle_type: initialVehicle.vehicle_type,
        engine_type: initialVehicle.engine_type ?? 'GASOLINE',
        motorbike_cc_group: initialVehicle.motorbike_cc_group ?? null,
        car_body_type: initialVehicle.car_body_type ?? null,
        seat_count: initialVehicle.seat_count ?? null,
        brand: initialVehicle.brand ?? '',
        model: initialVehicle.model ?? '',
        color: initialVehicle.color ?? '',
        is_default: initialVehicle.is_default ?? false,
        is_active: initialVehicle.is_active,
      })
    }
  }, [open, mode, initialVehicle, fixedCustomerId, form, allCustomers])

  const vehicleType = form.watch('vehicle_type')

  const renderFields = () => (
    <div className="space-y-4">
      {mode === 'create' && !fixedCustomerId ? (
        <div>
          <Label htmlFor={`customer_id-${mode}`} required>
            Khách hàng sở hữu
          </Label>
          <Select
            id={`customer_id-${mode}`}
            error={form.formState.errors.customer_id?.message}
            {...form.register('customer_id')}
          >
            <option value="">Chọn khách hàng</option>
            {allCustomers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.full_name} — {customer.phone}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`raw_license_plate-${mode}`} required>
            Biển số xe
          </Label>
          <Input
            id={`raw_license_plate-${mode}`}
            placeholder="59C1-234.56"
            error={form.formState.errors.raw_license_plate?.message}
            {...form.register('raw_license_plate')}
          />
        </div>
        <div>
          <Label htmlFor={`vehicle_type-${mode}`} required>
            Loại xe
          </Label>
          <Select
            id={`vehicle_type-${mode}`}
            error={form.formState.errors.vehicle_type?.message}
            {...form.register('vehicle_type')}
          >
            <option value="CAR">Ô tô</option>
            <option value="MOTORBIKE">Xe máy</option>
          </Select>
        </div>
        <div>
          <Label htmlFor={`engine_type-${mode}`} required>
            Loại động cơ
          </Label>
          <Select
            id={`engine_type-${mode}`}
            error={form.formState.errors.engine_type?.message}
            {...form.register('engine_type')}
          >
            <option value="GASOLINE">{ENGINE_LABELS.GASOLINE}</option>
            <option value="ELECTRIC">{ENGINE_LABELS.ELECTRIC}</option>
          </Select>
        </div>
        {vehicleType === 'MOTORBIKE' ? (
          <div>
            <Label htmlFor={`motorbike_cc_group-${mode}`} required>
              Nhóm phân khối
            </Label>
            <Select
              id={`motorbike_cc_group-${mode}`}
              error={form.formState.errors.motorbike_cc_group?.message}
              {...form.register('motorbike_cc_group')}
            >
              <option value="">Chọn phân khối</option>
              {Object.entries(CC_GROUP_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div>
            <Label htmlFor={`car_body_type-${mode}`} required>
              Kiểu dáng
            </Label>
            <Select
              id={`car_body_type-${mode}`}
              error={form.formState.errors.car_body_type?.message}
              {...form.register('car_body_type')}
            >
              <option value="">Chọn kiểu dáng</option>
              {Object.entries(CAR_BODY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        )}
        {vehicleType === 'CAR' ? (
          <div>
            <Label htmlFor={`seat_count-${mode}`}>Số chỗ ngồi</Label>
            <Input
              id={`seat_count-${mode}`}
              type="number"
              min={2}
              max={50}
              error={form.formState.errors.seat_count?.message}
              {...form.register('seat_count', {
                setValueAs: (value: unknown) => {
                  if (value === '' || value === null || value === undefined) return null
                  const num = Number(value)
                  return Number.isFinite(num) ? num : null
                },
              })}
            />
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor={`brand-${mode}`}>Hãng</Label>
          <Input
            id={`brand-${mode}`}
            placeholder="Toyota"
            error={form.formState.errors.brand?.message}
            {...form.register('brand')}
          />
        </div>
        <div>
          <Label htmlFor={`model-${mode}`}>Mẫu xe</Label>
          <Input
            id={`model-${mode}`}
            placeholder="Camry"
            error={form.formState.errors.model?.message}
            {...form.register('model')}
          />
        </div>
        <div>
          <Label htmlFor={`color-${mode}`}>Màu sắc</Label>
          <Input
            id={`color-${mode}`}
            placeholder="Trắng"
            error={form.formState.errors.color?.message}
            {...form.register('color')}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <input
            id={`is_default-${mode}`}
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            {...form.register('is_default')}
          />
          <Label htmlFor={`is_default-${mode}`} className="mb-0 cursor-pointer">
            Xe mặc định của khách
          </Label>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <input
            id={`is_active-${mode}`}
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            {...form.register('is_active')}
          />
          <Label htmlFor={`is_active-${mode}`} className="mb-0 cursor-pointer">
            Xe đang hoạt động
          </Label>
        </div>
      </div>
    </div>
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Thêm phương tiện' : 'Sửa phương tiện'}
      description={
        mode === 'create'
          ? 'Tạo phương tiện mới cho khách hàng trên hệ thống.'
          : `Cập nhật ${initialVehicle?.raw_license_plate ?? ''}`.trim()
      }
      className="max-w-3xl"
    >
      {mode === 'create' ? (
        <form
          onSubmit={form.handleSubmit((values) => onSubmit(values))}
          className="space-y-5"
        >
          {renderFields()}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Tạo phương tiện'
              )}
            </Button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={form.handleSubmit((values) =>
            onSubmit({
              raw_license_plate: values.raw_license_plate,
              vehicle_type: values.vehicle_type,
              engine_type: values.engine_type,
              motorbike_cc_group: values.motorbike_cc_group,
              car_body_type: values.car_body_type,
              seat_count: values.seat_count,
              brand: values.brand,
              model: values.model,
              color: values.color,
              is_default: values.is_default,
              is_active: values.is_active,
            }),
          )}
          className="space-y-5"
        >
          {renderFields()}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
