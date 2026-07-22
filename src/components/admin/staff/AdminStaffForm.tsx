import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import {
  STAFF_TYPE_COLORS,
  STAFF_TYPE_LABELS,
  STAFF_TYPES,
} from '../../../constants/staffType'
import {
  adminStaffCreateSchema,
  adminStaffEditSchema,
  type AdminStaffCreateFormValues,
  type AdminStaffEditFormValues,
} from '../../../lib/validations/adminStaff'
import { useAdminGarages } from '../../../hooks/api/admin/useAdminGarages'
import { useAdminStaffUsersWithoutProfile } from '../../../hooks/api/admin/useAdminStaff'
import type { AdminStaffRecord } from '../../../types/admin'
import { cn } from '../../../lib/utils'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Select } from '../../ui/Select'

interface AdminStaffFormProps {
  mode: 'create' | 'edit'
  initialRecord?: AdminStaffRecord
  /**
   * Optional: nút mở modal yêu cầu chuyển chức năng. FE page truyền vào để
   * hiển thị cạnh form khi edit. Khi không truyền, form chỉ render field.
   */
  onRequestTypeChange?: () => void
  onSubmit:
    | ((values: AdminStaffCreateFormValues) => Promise<void>)
    | ((values: AdminStaffEditFormValues) => Promise<void>)
  isSubmitting?: boolean
}

export function AdminStaffForm({
  mode,
  initialRecord,
  onRequestTypeChange,
  onSubmit,
  isSubmitting = false,
}: AdminStaffFormProps) {
  const { data: availableUsers = [] } = useAdminStaffUsersWithoutProfile()
  const { allGarages: garages } = useAdminGarages()

  // Create mode giữ nguyên staff_type. Edit mode KHÔNG cho sửa staff_type
  // (BE cấm trong StaffProfileUpdateRequest, chỉ đổi qua workflow
  // staff-type-change-requests).
  const createForm = useForm<AdminStaffCreateFormValues>({
    resolver: zodResolver(adminStaffCreateSchema),
    defaultValues: {
      user_id: initialRecord?.user.id ?? '',
      staff_code: initialRecord?.profile.staff_code ?? '',
      staff_type: initialRecord?.profile.staff_type ?? 'CUSTOMER_SERVICE_STAFF',
      garage_id: initialRecord?.profile.garage_id ?? '',
      is_active: initialRecord?.profile.is_active ?? true,
    },
  })

  const editForm = useForm<AdminStaffEditFormValues>({
    resolver: zodResolver(adminStaffEditSchema),
    defaultValues: {
      user_id: initialRecord?.user.id ?? '',
      staff_code: initialRecord?.profile.staff_code ?? '',
      garage_id: initialRecord?.profile.garage_id ?? '',
      is_active: initialRecord?.profile.is_active ?? true,
    },
  })

  const form = mode === 'create' ? createForm : editForm
  const errors = form.formState.errors

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <Label htmlFor="user_id">Tài khoản nhân viên (user_id)</Label>
        {mode === 'create' ? (
          <Select
            id="user_id"
            error={errors.user_id?.message}
            {...createForm.register('user_id')}
          >
            <option value="">Chọn tài khoản STAFF</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} — {user.phone} ({user.id})
              </option>
            ))}
          </Select>
        ) : (
          <>
            <input type="hidden" {...editForm.register('user_id')} />
            <Input
              id="user_id"
              value={`${initialRecord?.user.full_name} (${initialRecord?.user.id})`}
              disabled
            />
          </>
        )}
        {mode === 'create' && availableUsers.length === 0 ? (
          <p className="mt-1.5 text-sm text-amber-700">
            Tất cả tài khoản STAFF hiện đã có hồ sơ. Thêm user STAFF mới trong hệ thống để tạo thêm.
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
            {...form.register('staff_code')}
          />
        </div>

        {mode === 'create' ? (
          <div>
            <Label htmlFor="staff_type">Vai trò</Label>
            <Select
              id="staff_type"
              error={errors.staff_type?.message}
              {...createForm.register('staff_type')}
            >
              {STAFF_TYPES.map((type) => (
                <option key={type} value={type}>
                  {STAFF_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-slate-500">
              Vai trò chỉ được chọn khi tạo. Sau khi tạo, mọi thay đổi vai trò
              phải qua yêu cầu chuyển chức năng.
            </p>
          </div>
        ) : (
          <div>
            <Label>Vai trò hiện tại</Label>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                  STAFF_TYPE_COLORS[
                    initialRecord?.profile.staff_type ?? 'CUSTOMER_SERVICE_STAFF'
                  ],
                )}
              >
                {STAFF_TYPE_LABELS[
                  initialRecord?.profile.staff_type ?? 'CUSTOMER_SERVICE_STAFF'
                ] ?? initialRecord?.profile.staff_type}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              BE cấm đổi trực tiếp tại đây. Bấm{' '}
              <strong>Yêu cầu chuyển chức năng</strong> bên dưới để gửi yêu
              cầu phê duyệt.
            </p>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="garage_id">Garage làm việc</Label>
        <Select
          id="garage_id"
          error={errors.garage_id?.message}
          {...form.register('garage_id')}
        >
          <option value="">Chưa phân công garage</option>
          {garages.map((garage) => (
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
          {...form.register('is_active')}
        />
        <Label htmlFor="is_active" className="mb-0 cursor-pointer">
          Đang làm việc (is_active)
        </Label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
        {mode === 'edit' && onRequestTypeChange ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onRequestTypeChange}
          >
            Yêu cầu chuyển chức năng
          </Button>
        ) : (
          <span />
        )}
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
