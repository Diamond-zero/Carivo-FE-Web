import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { STAFF_TYPE_LABELS, STAFF_TYPES } from '../../../constants/staffType'
import {
  adminStaffFormSchema,
  type AdminStaffFormValues,
} from '../../../lib/validations/adminStaff'
import { mockAdminGarages } from '../../../mocks/admin'
import { getStaffUsersWithoutProfile } from '../../../mocks/admin/adminStaffStore'
import type { AdminStaffRecord } from '../../../types/admin'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Select } from '../../ui/Select'

interface AdminStaffFormProps {
  mode: 'create' | 'edit'
  initialRecord?: AdminStaffRecord
  onSubmit: (values: AdminStaffFormValues) => Promise<void>
  isSubmitting?: boolean
}

export function AdminStaffForm({
  mode,
  initialRecord,
  onSubmit,
  isSubmitting = false,
}: AdminStaffFormProps) {
  const availableUsers = getStaffUsersWithoutProfile()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminStaffFormValues>({
    resolver: zodResolver(adminStaffFormSchema),
    defaultValues: {
      user_id: initialRecord?.user.id ?? '',
      staff_code: initialRecord?.profile.staff_code ?? '',
      staff_type: initialRecord?.profile.staff_type ?? 'CUSTOMER_SERVICE_STAFF',
      garage_id: initialRecord?.profile.garage_id ?? mockAdminGarages[0]?.id ?? '',
      is_active: initialRecord?.profile.is_active ?? true,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <Label htmlFor="user_id">Tài khoản nhân viên (user_id)</Label>
        {mode === 'create' ? (
          <Select id="user_id" error={errors.user_id?.message} {...register('user_id')}>
            <option value="">Chọn tài khoản STAFF</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} — {user.phone} ({user.id})
              </option>
            ))}
          </Select>
        ) : (
          <>
            <input type="hidden" {...register('user_id')} />
            <Input
              id="user_id"
              value={`${initialRecord?.user.full_name} (${initialRecord?.user.id})`}
              disabled
            />
          </>
        )}
        {mode === 'create' && availableUsers.length === 0 ? (
          <p className="mt-1.5 text-sm text-amber-700">
            Tất cả tài khoản STAFF hiện đã có hồ sơ. Thêm user STAFF mới trong mock để tạo thêm.
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="staff_code">Mã nhân viên</Label>
          <Input
            id="staff_code"
            placeholder="STF009"
            error={errors.staff_code?.message}
            {...register('staff_code')}
          />
        </div>

        <div>
          <Label htmlFor="staff_type">Vai trò</Label>
          <Select id="staff_type" error={errors.staff_type?.message} {...register('staff_type')}>
            {STAFF_TYPES.map((type) => (
              <option key={type} value={type}>
                {STAFF_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="garage_id">Garage làm việc</Label>
        <Select id="garage_id" error={errors.garage_id?.message} {...register('garage_id')}>
          {mockAdminGarages.map((garage) => (
            <option key={garage.id} value={garage.id}>
              {garage.name} ({garage.garage_code})
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
        <input
          id="is_active"
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          {...register('is_active')}
        />
        <Label htmlFor="is_active" className="mb-0 cursor-pointer">
          Đang làm việc (is_active)
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
            'Tạo hồ sơ nhân viên'
          ) : (
            'Lưu thay đổi'
          )}
        </Button>
      </div>
    </form>
  )
}
