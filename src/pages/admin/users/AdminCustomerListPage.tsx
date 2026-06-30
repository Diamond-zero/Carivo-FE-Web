import { Loader2, Lock, Trash2, Unlock, UserCheck, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminCustomerListTable } from '../../../components/admin/customer/AdminCustomerListTable'
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
  useAdminCustomers,
  useDeleteAdminCustomer,
  useUpdateAdminCustomerStatus,
} from '../../../hooks/api/admin/useAdminCustomers'

const STATUS_OPTIONS: Array<{ value: boolean | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: true, label: 'Đang hoạt động' },
  { value: false, label: 'Đã khóa' },
]

export function AdminCustomerListPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<boolean | 'ALL'>('ALL')
  const [confirmToggleId, setConfirmToggleId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { customers, allCustomers, isLoading, isError, error } =
    useAdminCustomers({
      query,
      isActiveFilter: statusFilter,
    })

  const toggleStatusMutation = useUpdateAdminCustomerStatus()
  const deleteMutation = useDeleteAdminCustomer()

  const activeCount = allCustomers.filter((user) => user.is_active).length
  const lockedCount = allCustomers.length - activeCount
  const hasActiveFilter =
    query.trim().length > 0 || statusFilter !== 'ALL'

  const pendingUser = confirmToggleId
    ? allCustomers.find((user) => user.id === confirmToggleId)
    : undefined
  const deletingUser = deleteId
    ? allCustomers.find((user) => user.id === deleteId)
    : undefined

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
        <PageHeader title="Khách hàng" description="Quản lý khách hàng toàn hệ thống." />
        <EmptyState
          icon={Users}
          title="Không thể tải danh sách khách hàng"
          description={getApiErrorMessage(error, 'Vui lòng thử lại sau.')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Khách hàng"
        description="Quản lý khách hàng toàn hệ thống — xem hồ sơ, loyalty và khóa/mở khóa tài khoản."
        action={
          <Link to="/admin/users">
            <Button variant="secondary">Xem tất cả người dùng</Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Tổng khách hàng"
          value={allCustomers.length}
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
          icon={Lock}
          accent="violet"
        />
      </div>

      <div className="mb-6 space-y-4">
        <CustomerSearchPanel
          query={query}
          onChange={setQuery}
          onReset={() => setQuery('')}
        />
        <div className="carivo-panel max-w-xs p-4">
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>
            {customers.length} khách hàng
            {hasActiveFilter ? ' (đã lọc)' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <AdminCustomerListTable
            customers={customers}
            hasActiveFilter={hasActiveFilter}
            onToggleActive={setConfirmToggleId}
            onDelete={setDeleteId}
          />
        </CardContent>
      </Card>

      <Modal
        open={Boolean(confirmToggleId && pendingUser)}
        onClose={() =>
          !toggleStatusMutation.isPending && setConfirmToggleId(null)
        }
        title={
          pendingUser?.is_active
            ? 'Khóa tài khoản khách hàng?'
            : 'Mở khóa tài khoản khách hàng?'
        }
        description={
          pendingUser
            ? `${pendingUser.full_name} (${pendingUser.phone ?? '—'})`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setConfirmToggleId(null)}
            disabled={toggleStatusMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            variant={pendingUser?.is_active ? 'danger' : 'primary'}
            onClick={handleConfirmToggle}
            disabled={toggleStatusMutation.isPending}
          >
            {toggleStatusMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : pendingUser?.is_active ? (
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
        onClose={() => !deleteMutation.isPending && setDeleteId(null)}
        title="Xóa tài khoản khách hàng?"
        description={
          deletingUser
            ? `${deletingUser.full_name} (${deletingUser.phone ?? '—'})`
            : undefined
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-800">
            Thao tác này không thể hoàn tác. Người dùng sẽ mất quyền truy cập hệ thống
            ngay lập tức.
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setDeleteId(null)}
              disabled={deleteMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Xóa tài khoản
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}