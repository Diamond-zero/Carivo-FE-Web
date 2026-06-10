import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import {
  SERVICE_TYPE_LABELS,
  SERVICE_TYPES,
} from '../../../constants/servicePackage'
import { VEHICLE_TYPE_LABELS } from '../../../constants/washBayStatus'
import {
  adminServicePackageFormSchema,
  type AdminServicePackageFormValues,
} from '../../../lib/validations/adminServicePackage'
import { getAdminServicePackagesFromStore } from '../../../mocks/admin/adminServicePackageStore'
import type { ServicePackage } from '../../../types/servicePackage'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Select } from '../../ui/Select'
import { Textarea } from '../../ui/Textarea'

interface AdminServicePackageFormProps {
  mode: 'create' | 'edit'
  initialPackage?: ServicePackage
  onSubmit: (values: AdminServicePackageFormValues) => Promise<void>
  isSubmitting?: boolean
}

export function AdminServicePackageForm({
  mode,
  initialPackage,
  onSubmit,
  isSubmitting = false,
}: AdminServicePackageFormProps) {
  const allPackages = getAdminServicePackagesFromStore()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdminServicePackageFormValues>({
    resolver: zodResolver(adminServicePackageFormSchema),
    defaultValues: {
      name: initialPackage?.name ?? '',
      vehicle_type: initialPackage?.vehicle_type ?? 'CAR',
      service_type: initialPackage?.service_type ?? 'WASH',
      description: initialPackage?.description ?? '',
      base_price: initialPackage?.base_price ?? 100000,
      duration_minutes: initialPackage?.duration_minutes ?? 30,
      wash_bay_duration_minutes: initialPackage?.wash_bay_duration_minutes ?? 20,
      points_earned: initialPackage?.points_earned ?? 100,
      requires_wash_bay: initialPackage?.requires_wash_bay ?? true,
      requires_care_staff: initialPackage?.requires_care_staff ?? false,
      included_service_ids: initialPackage?.included_service_ids ?? [],
      is_active: initialPackage?.is_active ?? true,
    },
  })

  const serviceType = watch('service_type')
  const requiresWashBay = watch('requires_wash_bay')
  const includedIds = watch('included_service_ids')

  const comboOptions = useMemo(
    () =>
      allPackages.filter(
        (pkg) =>
          pkg.id !== initialPackage?.id &&
          pkg.service_type !== 'COMBO' &&
          pkg.is_active,
      ),
    [allPackages, initialPackage?.id],
  )

  const toggleIncluded = (packageId: string) => {
    const next = includedIds.includes(packageId)
      ? includedIds.filter((id) => id !== packageId)
      : [...includedIds, packageId]
    setValue('included_service_ids', next, { shouldValidate: true })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Tên gói dịch vụ</Label>
          <Input
            id="name"
            placeholder="Rửa xe ô tô cao cấp"
            error={errors.name?.message}
            {...register('name')}
          />
        </div>

        <div>
          <Label htmlFor="vehicle_type">Loại xe</Label>
          <Select
            id="vehicle_type"
            error={errors.vehicle_type?.message}
            {...register('vehicle_type')}
          >
            <option value="CAR">{VEHICLE_TYPE_LABELS.CAR}</option>
            <option value="MOTORBIKE">{VEHICLE_TYPE_LABELS.MOTORBIKE}</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="service_type">Loại dịch vụ</Label>
          <Select
            id="service_type"
            error={errors.service_type?.message}
            {...register('service_type')}
          >
            {SERVICE_TYPES.map((type) => (
              <option key={type} value={type}>
                {SERVICE_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            rows={3}
            placeholder="Mô tả ngắn gói dịch vụ..."
            error={errors.description?.message}
            {...register('description')}
          />
        </div>

        <div>
          <Label htmlFor="base_price">Giá cơ bản (VND)</Label>
          <Input
            id="base_price"
            type="number"
            min={1000}
            step={1000}
            error={errors.base_price?.message}
            {...register('base_price', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label htmlFor="duration_minutes">Thời lượng (phút)</Label>
          <Input
            id="duration_minutes"
            type="number"
            min={5}
            max={300}
            error={errors.duration_minutes?.message}
            {...register('duration_minutes', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label htmlFor="points_earned">Điểm tích lũy</Label>
          <Input
            id="points_earned"
            type="number"
            min={0}
            error={errors.points_earned?.message}
            {...register('points_earned', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label htmlFor="wash_bay_duration_minutes">Thời gian buồng rửa (phút)</Label>
          <Input
            id="wash_bay_duration_minutes"
            type="number"
            min={5}
            max={180}
            disabled={!requiresWashBay}
            placeholder={requiresWashBay ? '25' : 'Không áp dụng'}
            error={errors.wash_bay_duration_minutes?.message}
            {...register('wash_bay_duration_minutes', {
              setValueAs: (value) => (value === '' || value == null ? null : Number(value)),
            })}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600"
            {...register('requires_wash_bay')}
          />
          <span className="text-sm font-medium text-slate-700">Cần buồng rửa</span>
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600"
            {...register('requires_care_staff')}
          />
          <span className="text-sm font-medium text-slate-700">Cần nhân viên chăm sóc</span>
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 sm:col-span-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600"
            {...register('is_active')}
          />
          <span className="text-sm font-medium text-slate-700">Đang bán (is_active)</span>
        </label>
      </div>

      {serviceType === 'COMBO' ? (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
          <p className="mb-3 text-sm font-semibold text-amber-900">Gói bao gồm (COMBO)</p>
          <div className="space-y-2">
            {comboOptions.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có gói WASH/ADDON để chọn.</p>
            ) : (
              comboOptions.map((pkg) => (
                <label
                  key={pkg.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/80 bg-white px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={includedIds.includes(pkg.id)}
                    onChange={() => toggleIncluded(pkg.id)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  />
                  <span className="text-sm text-slate-700">
                    {pkg.name}{' '}
                    <span className="text-slate-400">({SERVICE_TYPE_LABELS[pkg.service_type]})</span>
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      ) : null}

      {mode === 'edit' && initialPackage ? (
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Steps template</p>
          <p className="mt-1">
            {initialPackage.steps_template.length} bước thực hiện — chỉnh sửa chi tiết sẽ có ở commit
            Steps Template Editor.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-600">
          Tạo mới sẽ tự sinh <strong>3 bước mặc định</strong> (tiền xử lý → rửa → sấy).
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : mode === 'create' ? (
            'Tạo gói dịch vụ'
          ) : (
            'Lưu thay đổi'
          )}
        </Button>
      </div>
    </form>
  )
}
