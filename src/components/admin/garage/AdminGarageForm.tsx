import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import {
  adminGarageFormSchema,
  type AdminGarageFormValues,
} from '../../../lib/validations/adminGarage'
import type { Garage } from '../../../types/garage'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'

interface AdminGarageFormProps {
  mode: 'create' | 'edit'
  initialGarage?: Garage
  onSubmit: (values: AdminGarageFormValues) => Promise<void>
  isSubmitting?: boolean
}

export function AdminGarageForm({
  mode,
  initialGarage,
  onSubmit,
  isSubmitting = false,
}: AdminGarageFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminGarageFormValues>({
    resolver: zodResolver(adminGarageFormSchema),
    defaultValues: {
      name: initialGarage?.name ?? '',
      garage_code: initialGarage?.garage_code ?? '',
      address: initialGarage?.address ?? '',
      city: initialGarage?.city ?? '',
      phone: initialGarage?.phone ?? '',
      opening_time: initialGarage?.opening_time ?? '07:00',
      closing_time: initialGarage?.closing_time ?? '18:00',
      slot_interval_minutes: initialGarage?.slot_interval_minutes ?? 30,
      is_active: initialGarage?.is_active ?? true,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Tên garage</Label>
          <Input
            id="name"
            placeholder="Carivo Quận 7"
            error={errors.name?.message}
            {...register('name')}
          />
        </div>

        <div>
          <Label htmlFor="garage_code">Mã garage</Label>
          <Input
            id="garage_code"
            placeholder="Q7-HCM-01"
            error={errors.garage_code?.message}
            {...register('garage_code')}
          />
        </div>

        <div>
          <Label htmlFor="phone">Hotline</Label>
          <Input
            id="phone"
            placeholder="02838761234"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="address">Địa chỉ</Label>
          <Input
            id="address"
            placeholder="123 Nguyễn Thị Thập, Quận 7"
            error={errors.address?.message}
            {...register('address')}
          />
        </div>

        <div>
          <Label htmlFor="city">Thành phố</Label>
          <Input
            id="city"
            placeholder="TP. Hồ Chí Minh"
            error={errors.city?.message}
            {...register('city')}
          />
        </div>

        <div>
          <Label htmlFor="slot_interval_minutes">Khoảng slot (phút)</Label>
          <Input
            id="slot_interval_minutes"
            type="number"
            min={15}
            max={120}
            step={5}
            error={errors.slot_interval_minutes?.message}
            {...register('slot_interval_minutes', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label htmlFor="opening_time">Giờ mở cửa</Label>
          <Input
            id="opening_time"
            type="time"
            error={errors.opening_time?.message}
            {...register('opening_time')}
          />
        </div>

        <div>
          <Label htmlFor="closing_time">Giờ đóng cửa</Label>
          <Input
            id="closing_time"
            type="time"
            error={errors.closing_time?.message}
            {...register('closing_time')}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
        <input
          id="is_active"
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          {...register('is_active')}
        />
        <Label htmlFor="is_active" className="mb-0 cursor-pointer">
          Garage đang hoạt động (is_active)
        </Label>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : mode === 'create' ? (
            'Tạo garage'
          ) : (
            'Lưu thay đổi'
          )}
        </Button>
      </div>
    </form>
  )
}
