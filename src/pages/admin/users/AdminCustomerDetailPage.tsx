import {
  ArrowLeft,
  Car,
  Lock,
  Mail,
  Pencil,
  Phone,
  Shield,
  Trash2,
  Trophy,
  Unlock,
  UserX,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import type { AdminUpdateUserPayload } from '../../../api/user.api'
import { AdminCustomerBookingsTable } from '../../../components/admin/customer/AdminCustomerBookingsTable'
import { CustomerLoyaltyCard } from '../../../components/customer/CustomerLoyaltyCard'
import { CustomerVehicleList } from '../../../components/customer/CustomerVehicleList'
import { LoyaltyPointHistoryList } from '../../../components/customer/LoyaltyPointHistoryList'
import { TierBadge } from '../../../components/customer/TierBadge'
import { TierUpgradeHistoryList } from '../../../components/customer/TierUpgradeHistoryList'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminCustomerDetail,
  useDeleteAdminCustomer,
  useUpdateAdminCustomer,
  useUpdateAdminCustomerRole,
  useUpdateAdminCustomerStatus,
} from '../../../hooks/api/admin/useAdminCustomers'
import { useAdminGarages } from '../../../hooks/api/admin/useAdminGarages'
import { cn } from '../../../lib/utils'

const ROLE_OPTIONS: Array<{ value: 'CUSTOMER' | 'STAFF' | 'ADMIN'; label: string }> = [
  { value: 'CUSTOMER', label: 'Khách hàng' },
  { value: 'STAFF', label: 'Nhân viên' },
  { value: 'ADMIN', label: 'Quản trị viên' },
]

export function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { showToast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [editFullName, setEditFullName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editRole, setEditRole] = useState<'CUSTOMER' | 'STAFF' | 'ADMIN'>('CUSTOMER')

  const {
    user,
    loyalty,
    vehicles,
    bookings,
    tierHistory,
    pointHistory,
    isLoading,
    isError,
    error,
  } = useAdminCustomerDetail(id)
  const updateStatusMutation = useUpdateAdminCustomerStatus()
  const updateUserMutation = useUpdateAdminCustomer()
  const updateRoleMutation = useUpdateAdminCustomerRole()
  const deleteUserMutation = useDeleteAdminCustomer()
  const { allGarages } = useAdminGarages()
  const garageNameById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const garage of allGarages) {
      map[garage.id] = garage.name
    }
    return map
  }, [allGarages])

  if (!id) {
    return <Navigate to="/admin/users/customers" replace />
  }

  if (!isLoading && (isError || !user)) {
    return (
      <div>
        <PageHeader
          title="Không tìm thấy khách hàng"
          description="Khách hàng không tồn tại trong hệ thống Carivo."
          action={
            <Link to="/admin/users/customers">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách
              </Button>
            </Link>
          }
        />
        <EmptyState
          icon={UserX}
          title="Khách hàng không tồn tại"
          description={getApiErrorMessage(
            error,
            'Mã khách không khớp với dữ liệu hệ thống.',
          )}
          action={
            <Link to="/admin/users/customers">
              <Button>Về danh sách khách</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const isActive = user?.is_active ?? true

  const openEdit = () => {
    if (!user) return
    setEditFullName(user.full_name)
    setEditEmail(user.email ?? '')
    setEditPhone(user.phone)
    setEditOpen(true)
  }

  const openRoleModal = () => {
    if (!user) return
    setEditRole(user.role)
    setRoleOpen(true)
  }

  const handleToggleStatus = () => {
    if (!user) return

    const nextActive = !isActive
    updateStatusMutation.mutate(
      { userId: user.id, isActive: nextActive },
      {
        onSuccess: () => {
          setConfirmOpen(false)
          showToast(
            nextActive
              ? `Đã mở khóa tài khoản ${user.full_name}.`
              : `Đã khóa tài khoản ${user.full_name}.`,
            'success',
          )
        },
        onError: (mutationError) => {
          showToast(
            getApiErrorMessage(mutationError, 'Không thể thay đổi trạng thái tài khoản.'),
            'error',
          )
        },
      },
    )
  }

  const handleSaveEdit = () => {
    if (!user) return
    const trimmedName = editFullName.trim()
    const trimmedEmail = editEmail.trim()
    const trimmedPhone = editPhone.trim()

    const payload: AdminUpdateUserPayload = {}
    if (trimmedName) payload.full_name = trimmedName
    if (trimmedEmail) payload.email = trimmedEmail
    if (trimmedPhone) payload.phone = trimmedPhone

    if (Object.keys(payload).length === 0) {
      showToast('Không có thay đổi nào để lưu.', 'info')
      return
    }

    updateUserMutation.mutate(
      { userId: user.id, payload },
      {
        onSuccess: () => {
          setEditOpen(false)
          showToast(`Đã cập nhật hồ sơ ${user.full_name}.`, 'success')
        },
        onError: (mutationError) => {
          showToast(getApiErrorMessage(mutationError, 'Không thể cập nhật hồ sơ.'), 'error')
        },
      },
    )
  }

  const handleSaveRole = () => {
    if (!user) return
    updateRoleMutation.mutate(
      { userId: user.id, payload: { role: editRole } },
      {
        onSuccess: () => {
          setRoleOpen(false)
          showToast(`Đã đổi vai trò của ${user.full_name} sang ${editRole}.`, 'success')
        },
        onError: (mutationError) => {
          showToast(getApiErrorMessage(mutationError, 'Không thể đổi vai trò.'), 'error')
        },
      },
    )
  }

  const handleDelete = () => {
    if (!user) return
    deleteUserMutation.mutate(user.id, {
      onSuccess: () => {
        setDeleteOpen(false)
        showToast(`Đã xóa tài khoản ${user.full_name}.`, 'success')
      },
      onError: (mutationError) => {
        showToast(getApiErrorMessage(mutationError, 'Không thể xóa tài khoản.'), 'error')
      },
    })
  }

  return (
    <div>
      {isLoading || !user ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Quản trị"
            title={user.full_name}
            description="Chi tiết khách hàng toàn hệ thống — loyalty, phương tiện và lịch sử booking."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/admin/users/customers/${user.id}/vehicles`}>
                  <Button variant="secondary">
                    <Car className="h-4 w-4" />
                    Phương tiện
                  </Button>
                </Link>
                <Link to={`/admin/users/customers/${user.id}/loyalty`}>
                  <Button variant="secondary">
                    <Trophy className="h-4 w-4" />
                    Loyalty
                  </Button>
                </Link>
                <Button variant="secondary" onClick={openEdit}>
                  <Pencil className="h-4 w-4" />
                  Sửa hồ sơ
                </Button>
                <Button variant="secondary" onClick={openRoleModal}>
                  <Shield className="h-4 w-4" />
                  Đổi vai trò
                </Button>
                <Button
                  variant={isActive ? 'danger' : 'primary'}
                  onClick={() => setConfirmOpen(true)}
                >
                  {isActive ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Khóa tài khoản
                    </>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4" />
                      Mở khóa tài khoản
                    </>
                  )}
                </Button>
                <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </Button>
                <Link to="/admin/users/customers">
                  <Button variant="secondary">
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                  </Button>
                </Link>
              </div>
            }
          />

          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Hồ sơ khách</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-lg font-semibold text-violet-800">
                    {user.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{user.full_name}</p>
                    {loyalty ? (
                      <TierBadge tier={loyalty.current_tier} />
                    ) : (
                      <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        Chưa có loyalty
                      </span>
                    )}
                    <p className="mt-1 text-sm text-slate-600">
                      <Phone className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
                      {user.phone || 'Chưa cập nhật số điện thoại'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{user.phone || '—'}</span>
                  </div>
                  {user.email ? (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {user.email}
                    </div>
                  ) : null}
                  <p className="text-xs text-slate-500">Mã người dùng: {user.id}</p>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                      isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700',
                    )}
                  >
                    {isActive ? 'Đang hoạt động' : 'Đã khóa'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              {loyalty ? (
                <CustomerLoyaltyCard loyalty={loyalty} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Loyalty</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EmptyState
                      compact
                      icon={Trophy}
                      title="Chưa có dữ liệu loyalty"
                      description="Khách hàng chưa phát sinh giao dịch — loyalty sẽ tự tạo sau lần đầu booking hoàn tất."
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lịch sử nâng hạ</CardTitle>
              </CardHeader>
              <CardContent>
                <TierUpgradeHistoryList records={tierHistory} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lịch sử điểm loyalty</CardTitle>
              </CardHeader>
              <CardContent>
                <LoyaltyPointHistoryList records={pointHistory} />
              </CardContent>
            </Card>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Phương tiện</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerVehicleList vehicles={vehicles} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Booking toàn hệ thống ({bookings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 pb-2">
                <AdminCustomerBookingsTable
                  bookings={bookings}
                  garageNameById={garageNameById}
                />
              </CardContent>
            </Card>
          </div>

<Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={isActive ? 'Khóa tài khoản khách hàng?' : 'Mở khóa tài khoản khách hàng?'}
        description={
          isActive
            ? `Khách ${user.full_name} sẽ không thể đăng nhập hoặc đặt lịch cho đến khi được mở khóa.`
            : `Khách ${user.full_name} sẽ được phép sử dụng lại tài khoản.`
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Hủy
          </Button>
          <Button
            variant={isActive ? 'danger' : 'primary'}
            onClick={handleToggleStatus}
            disabled={updateStatusMutation.isPending}
          >
            {isActive ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Sửa hồ sơ khách hàng"
        description={`Cập nhật thông tin của ${user.full_name}.`}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-full_name">Họ và tên</Label>
            <Input
              id="edit-full_name"
              value={editFullName}
              onChange={(event) => setEditFullName(event.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(event) => setEditEmail(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Số điện thoại</Label>
              <Input
                id="edit-phone"
                value={editPhone}
                onChange={(event) => setEditPhone(event.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={roleOpen}
        onClose={() => setRoleOpen(false)}
        title="Đổi vai trò"
        description={`Thay đổi vai trò cho ${user.full_name}.`}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-role">Vai trò</Label>
            <Select
              id="edit-role"
              value={editRole}
              onChange={(event) =>
                setEditRole(event.target.value as 'CUSTOMER' | 'STAFF' | 'ADMIN')
              }
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setRoleOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Xóa tài khoản khách hàng?"
        description={`${user.full_name} (${user.phone})`}
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-800">
            Thao tác này không thể hoàn tác. Mọi dữ liệu liên quan đến khách hàng sẽ bị ảnh hưởng.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? 'Đang xóa...' : 'Xóa tài khoản'}
            </Button>
          </div>
        </div>
      </Modal>
        </>
      )}
    </div>
  )
}
