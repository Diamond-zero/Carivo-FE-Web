import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ShieldCheck, UserPlus, UserRoundCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { getApiErrorMessage } from '../../../api/client'
import {
  useAdminCreateUser,
  useAdminPromoteUser,
} from '../../../hooks/api/admin/useAdminCreateUser'
import { useAdminUsers } from '../../../hooks/api/admin/useAdminUsers'
import {
  adminCreateUserSchema,
  adminPromoteUserSchema,
  type AdminCreateUserValues,
  type AdminPromoteUserValues,
} from '../../../lib/validations/adminUser'
import type { User, UserRole } from '../../../types/user'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import { Select } from '../../ui/Select'

type TabKey = 'create' | 'promote'

interface AdminCreateUserModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (user: User) => void
  defaultRole?: UserRole
}

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; description: string }> = [
  {
    value: 'CUSTOMER',
    label: 'Khách hàng',
    description: 'Đặt lịch, xem lịch sử, tích điểm.',
  },
  {
    value: 'STAFF',
    label: 'Nhân viên',
    description: 'Vận hành garage. Sau đó vào "Thêm nhân viên" để tạo hồ sơ chi tiết.',
  },
]

const PROMOTEABLE_ROLES: Array<{ value: 'STAFF' | 'ADMIN'; label: string }> = [
  { value: 'STAFF', label: 'Nhân viên (STAFF)' },
  { value: 'ADMIN', label: 'Quản trị viên (ADMIN)' },
]

export function AdminCreateUserModal({
  open,
  onClose,
  onCreated,
  defaultRole = 'STAFF',
}: AdminCreateUserModalProps) {
  const [tab, setTab] = useState<TabKey>('create')
  const [lastOtp, setLastOtp] = useState<string | null>(null)

  const createMutation = useAdminCreateUser()
  const promoteMutation = useAdminPromoteUser()

  const { allUsers } = useAdminUsers({})

  const createForm = useForm<AdminCreateUserValues>({
    resolver: zodResolver(adminCreateUserSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      password: '',
      role: defaultRole,
      is_active: true,
    },
  })

  const promoteForm = useForm<AdminPromoteUserValues>({
    resolver: zodResolver(adminPromoteUserSchema),
    defaultValues: {
      user_id: '',
      role: 'STAFF',
    },
  })

  useEffect(() => {
    if (open) {
      setTab('create')
      setLastOtp(null)
      createForm.reset({
        full_name: '',
        phone: '',
        email: '',
        password: '',
        role: defaultRole,
        is_active: true,
      })
      promoteForm.reset({ user_id: '', role: 'STAFF' })
    }
  }, [open, defaultRole, createForm, promoteForm])

  const promotableUsers = useMemo(
    () => allUsers.filter((user) => user.role === 'CUSTOMER' && user.is_active),
    [allUsers],
  )

  const handleCreateSubmit = createForm.handleSubmit(async (values) => {
    try {
      const result = await createMutation.mutateAsync(values)
      setLastOtp(result.otpDebug ?? null)
      onCreated?.(result.user)
    } catch {
      // surfaced via mutation.error below
    }
  })

  const handlePromoteSubmit = promoteForm.handleSubmit(async (values) => {
    try {
      const user = await promoteMutation.mutateAsync(values)
      onCreated?.(user)
    } catch {
      // surfaced via mutation.error below
    }
  })

  const isBusy = createMutation.isPending || promoteMutation.isPending
  const activeError = createMutation.error ?? promoteMutation.error

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thêm người dùng"
      description="Tạo tài khoản mới hoặc nâng cấp tài khoản khách hàng hiện có lên STAFF/ADMIN."
      className="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="flex gap-2 rounded-xl bg-slate-100/80 p-1">
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
              tab === 'create'
                ? 'bg-white text-brand-700 shadow-[var(--shadow-carivo-sm)]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            disabled={isBusy}
          >
            <UserPlus className="h-4 w-4" />
            Tạo tài khoản mới
          </button>
          <button
            type="button"
            onClick={() => setTab('promote')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
              tab === 'promote'
                ? 'bg-white text-brand-700 shadow-[var(--shadow-carivo-sm)]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            disabled={isBusy}
          >
            <UserRoundCheck className="h-4 w-4" />
            Nâng cấp user hiện có
          </button>
        </div>

        {activeError ? (
          <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-800">
            {getApiErrorMessage(activeError, 'Không thể thực hiện thao tác.')}
          </div>
        ) : null}

        {lastOtp ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
            Đã tạo tài khoản thành công. OTP debug (chỉ dev): <b>{lastOtp}</b>
          </div>
        ) : null}

        {tab === 'create' ? (
          <form className="space-y-4" onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="create-full-name">Họ và tên</Label>
                <Input
                  id="create-full-name"
                  placeholder="Nguyen Van A"
                  {...createForm.register('full_name')}
                  error={createForm.formState.errors.full_name?.message}
                />
              </div>
              <div>
                <Label htmlFor="create-phone">Số điện thoại</Label>
                <Input
                  id="create-phone"
                  inputMode="tel"
                  placeholder="0901234567"
                  {...createForm.register('phone')}
                  error={createForm.formState.errors.phone?.message}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="create-email">Email (tuỳ chọn)</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="nhanvien@carivo.vn"
                {...createForm.register('email')}
                error={createForm.formState.errors.email?.message}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="create-password">Mật khẩu khởi tạo</Label>
                <Input
                  id="create-password"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  {...createForm.register('password')}
                  error={createForm.formState.errors.password?.message}
                />
              </div>
              <div>
                <Label htmlFor="create-role">Vai trò</Label>
                <Select
                  id="create-role"
                  {...createForm.register('role')}
                  error={createForm.formState.errors.role?.message}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
              <ShieldCheck className="mr-2 inline h-4 w-4 text-brand-600" />
              Hệ thống sẽ tự động gửi OTP xác minh SĐT (môi trường dev BE trả về OTP
              debug để hoàn tất flow). Vai trò STAFF có thể được gán thêm hồ sơ chi
              tiết tại trang <b>Staff</b>.
            </div>

            <div className="flex items-center gap-2">
              <input
                id="create-active"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                {...createForm.register('is_active')}
              />
              <Label htmlFor="create-active" className="!mb-0 cursor-pointer">
                Kích hoạt tài khoản ngay
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onClose} disabled={isBusy}>
                Hủy
              </Button>
              <Button type="submit" disabled={isBusy}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Tạo tài khoản
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handlePromoteSubmit}>
            <div>
              <Label htmlFor="promote-user">Tài khoản CUSTOMER</Label>
              <Select
                id="promote-user"
                {...promoteForm.register('user_id')}
                error={promoteForm.formState.errors.user_id?.message}
              >
                <option value="">-- Chọn tài khoản --</option>
                {promotableUsers.length === 0 ? (
                  <option value="" disabled>
                    Không có tài khoản CUSTOMER đang hoạt động
                  </option>
                ) : (
                  promotableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} — {user.phone}
                      {user.email ? ` (${user.email})` : ''}
                    </option>
                  ))
                )}
              </Select>
            </div>
            <div>
              <Label htmlFor="promote-role">Vai trò mới</Label>
              <Select
                id="promote-role"
                {...promoteForm.register('role')}
                error={promoteForm.formState.errors.role?.message}
              >
                {PROMOTEABLE_ROLES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
              Sau khi nâng cấp, user sẽ xuất hiện trong dropdown <b>Tài khoản STAFF</b>{' '}
              của trang <b>Staff → Thêm nhân viên</b> để bạn tạo hồ sơ chi tiết.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onClose} disabled={isBusy}>
                Hủy
              </Button>
              <Button type="submit" disabled={isBusy}>
                {promoteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang nâng cấp...
                  </>
                ) : (
                  <>
                    <UserRoundCheck className="h-4 w-4" />
                    Nâng cấp vai trò
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}