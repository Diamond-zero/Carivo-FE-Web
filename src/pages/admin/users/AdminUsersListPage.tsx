import { Lock, Plus, Unlock, UserCheck, Users, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminCreateUserModal } from '../../../components/admin/user/AdminCreateUserModal'
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

const PAGE_SIZE = 20

export function AdminUsersListPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<User['role'] | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<boolean | 'ALL'>('ALL')
  const [confirmToggleId, setConfirmToggleId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [page, setPage] = useState(1)

  const {
    users,
    meta,
    totalUsers,
    activeUserCount,
    lockedUserCount,
    adminCount,
    staffCount,
    isLoading,
    isFetching,
    isError,
    error,
  } = useAdminUsers(
    {
      query,
      roleFilter,
      isActiveFilter: statusFilter,
    },
    page,
    PAGE_SIZE,
  )

  const toggleStatusMutation = useAdminUpdateUserStatus()
  const deleteMutation = useAdminDeleteUser()

  const totalPages = Math.max(meta?.total_pages ?? 1, 1)

  const hasActiveFilter =
    query.trim().length > 0 || roleFilter !== 'ALL' || statusFilter !== 'ALL'

  const pendingUser = confirmToggleId
    ? users.find((user) => user.id === confirmToggleId)
    : undefined
  const deletingUser = deleteId ? users.find((user) => user.id === deleteId) : undefined

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

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
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/users/customers">
              <Button variant="secondary">Xem khách hàng</Button>
            </Link>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Thêm người dùng
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng người dùng"
          value={totalUsers}
          icon={Users}
          accent="brand"
        />
        <StatCard
          label="Đang hoạt động"
          value={activeUserCount}
          icon={UserCheck}
          accent="emerald"
        />
        <StatCard
          label="Đã khóa"
          value={lockedUserCount}
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
          onChange={(value) => {
            setPage(1)
            setQuery(value)
          }}
          onReset={() => {
            setPage(1)
            setQuery('')
          }}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="carivo-panel p-4">
            <Label htmlFor="role-filter" className="mb-1.5">
              Lọc theo vai trò
            </Label>
            <Select
              id="role-filter"
              value={roleFilter}
              onChange={(event) => {
                setPage(1)
                setRoleFilter(event.target.value as User['role'] | 'ALL')
              }}
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
                setPage(1)
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
            {meta?.total ?? users.length} người dùng
            {hasActiveFilter ? ' (đã lọc)' : ''}
            {meta ? ` · Trang ${meta.page}/${totalPages}` : ''}
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
        {meta && totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-sm text-slate-600">
            <span>
              Trang {meta.page} / {totalPages} · {meta.total} người dùng
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
                disabled={page <= 1 || isFetching}
              >
                Trước
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page >= totalPages || isFetching}
              >
                Sau
              </Button>
            </div>
          </div>
        ) : null}
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

      <AdminCreateUserModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(user) => {
          setIsCreateOpen(false)
          showToast(
            `Đã tạo tài khoản ${user.full_name} (${user.role}).`,
            'success',
          )
        }}
      />
    </div>
  )
}
