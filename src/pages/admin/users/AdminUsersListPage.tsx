import { Lock, Unlock, UserCheck, Users, UserX } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminUsersListTable } from '../../../components/admin/user/AdminUsersListTable'
import { CustomerSearchPanel } from '../../../components/customer/CustomerSearchPanel'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Label } from '../../../components/ui/Label'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminDeleteUser,
  useAdminUpdateUserStatus,
  useAdminUsers,
} from '../../../hooks/api/admin/useAdminUsers'
import type { User } from '../../../types/user'

const ROLE_OPTIONS: Array<{ value: User['role'] | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Tất cả vai trò' },
  { value: 'CUSTOMER', label: 'Khách hàng' },
  { value: 'STAFF', label: 'Nhân viên' },
  { value: 'ADMIN', label: 'Quản trị viên' },
]

const STATUS_OPTIONS: Array<{ value: boolean | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: true, label: 'Đang hoạt động' },
  { value: false, label: 'Đã khóa' },
]

export function AdminUsersListPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<User['role'] | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<boolean | 'ALL'>('ALL')
  const [confirmToggleId, setConfirmToggleId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { users, allUsers, isLoading, isError, error } = useAdminUsers({
    query,
    roleFilter,
    isActiveFilter: statusFilter,
  })

  const toggleStatusMutation = useAdminUpdateUserStatus()
  const deleteMutation = useAdminDeleteUser()

  const activeCount = allUsers.filter((user) => user.is_active).length
  const lockedCount = allUsers.length - activeCount
  const adminCount = allUsers.filter((user) => user.role === 'ADMIN').length
  const staffCount = allUsers.filter((user) => user.role === 'STAFF').length

  const hasActiveFilter =
    query.trim().length > 0 || roleFilter !== 'ALL' || statusFilter !== 'ALL'

  const pendingUser = confirmToggleId
    ? allUsers.find((user) => user.id === confirmToggleId)
    : undefined
  const deletingUser = deleteId ? allUsers.find((user) => user.id === deleteId) : undefined

  const handleConfirmToggle = () => {
    if (!confirmToggleId || !pendingUser) return

    toggleStatusMutation.mutate(
      { userId: confirmToggleId, isActive: !pendingUser.is_active },
      {
        onSuccess: (updated) => {
          setConfirmToggleId(null)
          showToast(
            updated.is_active
              ? `Đã mở khóa tài khoản ${pendingUser.full_name}.`
              : `Đã khóa tài khoản ${pendingUser.full_name}.`,
            'success',
          )
        },
        onError: (mutationError) => {
          showToast(
            getApiErrorMessage(
              mutationError,
              'Không thể thay đổi trạng thái tài khoản.',
            ),
            'error',
          )
        },
      },
    )
  }

  const handleConfirmDelete = () => {
    if (!deleteId || !deletingUser) return

    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null)
        showToast(`Đã xóa tài khoản ${deletingUser.full_name}.`, 'success')
      },
      onError: (mutationError) => {
        showToast(
          getApiErrorMessage(mutationError, 'Không thể xóa tài khoản.'),
          'error',
        )
      },
    })
  }

  if (isLoading) {
    return (
      <div>
        <DashboardPageSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div>
        <PageHeader
          title="Tất cả người dùng"
          description="Danh sách toàn bộ người dùng hệ thống Carivo."
        />
        <EmptyState
          icon={Users}
          title="Không thể tải danh sách người dùng"
          description={getApiErrorMessage(error, 'Vui lòng thử lại sau.')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Tất cả người dùng"
        description="Quản lý toàn bộ tài khoản CUSTOMER, STAFF và ADMIN trên hệ thống — lọc theo vai trò và trạng thái."
        action={
          <Link to="/admin/users/customers">
            <Button variant="secondary">Xem khách hàng</Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng người dùng"
          value={allUsers.length}
          icon={Users}
          accent="brand"
        />
        <StatCard
          label="Đang hoạt động"
          value={activeCount}
          icon={UserCheck}
          accent="emerald"
        />
        <StatCard
          label="Đã khóa"
          value={lockedCount}
          icon={UserX}
          accent="rose"
        />
        <StatCard
          label="Quản trị viên / Nhân viên"
          value={`${adminCount} / ${staffCount}`}
          icon={UserCheck}
          accent="violet"
        />
      </div>

      <div className="mb-6 space-y-4">
        <CustomerSearchPanel
          query={query}
          onChange={setQuery}
          onReset={() => setQuery('')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="carivo-panel p-4">
            <Label htmlFor="role-filter" className="mb-1.5">
              Lọc theo vai trò
            </Label>
            <Select
              id="role-filter"
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as User['role'] | 'ALL')
              }
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="carivo-panel p-4">
            <Label htmlFor="status-filter" className="mb-1.5">
              Lọc theo trạng thái
            </Label>
            <Select
              id="status-filter"
              value={String(statusFilter)}
              onChange={(event) => {
                const value = event.target.value
                if (value === 'ALL') setStatusFilter('ALL')
                else setStatusFilter(value === 'true')
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {users.length} người dùng
            {hasActiveFilter ? ' (đã lọc)' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <AdminUsersListTable
            users={users}
            hasActiveFilter={hasActiveFilter}
            onToggleActive={setConfirmToggleId}
            onDelete={setDeleteId}
          />
        </CardContent>
      </Card>

      <Modal
        open={Boolean(confirmToggleId && pendingUser)}
        onClose={() => setConfirmToggleId(null)}
        title={
          pendingUser?.is_active
            ? 'Khóa tài khoản người dùng?'
            : 'Mở khóa tài khoản người dùng?'
        }
        description={
          pendingUser
            ? `${pendingUser.full_name} (${pendingUser.phone}) — vai trò ${pendingUser.role}.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmToggleId(null)}>
            Hủy
          </Button>
          <Button
            variant={pendingUser?.is_active ? 'danger' : 'primary'}
            onClick={handleConfirmToggle}
            disabled={toggleStatusMutation.isPending}
          >
            {pendingUser?.is_active ? (
              <>
                <Lock className="h-4 w-4" />
                Xác nhận khóa
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4" />
                Xác nhận mở khóa
              </>
            )}
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteId && deletingUser)}
        onClose={() => setDeleteId(null)}
        title="Xóa tài khoản người dùng?"
        description={
          deletingUser
            ? `${deletingUser.full_name} (${deletingUser.phone}) — vai trò ${deletingUser.role}.`
            : undefined
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-800">
            Thao tác này không thể hoàn tác. Người dùng sẽ mất quyền truy cập hệ thống
            ngay lập tức.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa tài khoản'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}