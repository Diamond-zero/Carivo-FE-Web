import { Plus, UserCheck, UserCog, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminStaffListTable } from '../../../components/admin/staff/AdminStaffListTable'
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
import { STAFF_TYPE_LABELS, STAFF_TYPES } from '../../../constants/staffType'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminGarages } from '../../../hooks/api/admin/useAdminGarages'
import {
  useAdminStaff,
  useDeleteAdminStaff,
  useToggleAdminStaffStatus,
} from '../../../hooks/api/admin/useAdminStaff'
import type { StaffType } from '../../../types/staffProfile'

export function AdminStaffListPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [garageFilter, setGarageFilter] = useState<string | 'ALL'>('ALL')
  const [staffTypeFilter, setStaffTypeFilter] = useState<StaffType | 'ALL'>('ALL')
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | 'ALL'>('ALL')
  const [confirmProfileId, setConfirmProfileId] = useState<string | null>(null)
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null)

  const { allGarages: garages } = useAdminGarages()
  const { staff, allStaff, isLoading, isError, error } = useAdminStaff({
    query,
    garageFilter,
    staffTypeFilter,
    isActiveFilter,
  })
  const toggleMutation = useToggleAdminStaffStatus()
  const deleteMutation = useDeleteAdminStaff()

  const activeCount = allStaff.filter(
    (record) => record.profile.is_active && record.user.is_active,
  ).length
  const hasActiveFilter =
    query.trim().length > 0 ||
    garageFilter !== 'ALL' ||
    staffTypeFilter !== 'ALL' ||
    isActiveFilter !== 'ALL'

  const pendingRecord = confirmProfileId
    ? allStaff.find((record) => record.profile.id === confirmProfileId)
    : undefined
  const deletingRecord = deleteProfileId
    ? allStaff.find((record) => record.profile.id === deleteProfileId)
    : undefined

  const handleConfirmToggle = () => {
    if (!confirmProfileId || !pendingRecord) return

    toggleMutation.mutate(
      {
        profileId: confirmProfileId,
        isActive: !pendingRecord.profile.is_active,
      },
      {
        onSuccess: (record) => {
          setConfirmProfileId(null)
          showToast(
            record.profile.is_active
              ? `Đã kích hoạt nhân viên ${record.user.full_name}.`
              : `Đã ngưng làm việc ${record.user.full_name}.`,
            'success',
          )
        },
        onError: (mutationError) => {
          showToast(
            getApiErrorMessage(mutationError, 'Không thể thay đổi trạng thái nhân viên.'),
            'error',
          )
        },
      },
    )
  }

  const handleConfirmDelete = () => {
    if (!deleteProfileId || !deletingRecord) return

    deleteMutation.mutate(deleteProfileId, {
      onSuccess: () => {
        setDeleteProfileId(null)
        showToast(`Đã xóa hồ sơ nhân viên ${deletingRecord.user.full_name}.`, 'success')
      },
      onError: (mutationError) => {
        showToast(
          getApiErrorMessage(
            mutationError,
            'Không thể xóa nhân viên. Hãy ngưng làm việc trước.',
          ),
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
        <PageHeader title="Nhân viên" description="Quản lý hồ sơ nhân viên." />
        <EmptyState
          icon={Users}
          title="Không thể tải danh sách nhân viên"
          description={getApiErrorMessage(error, 'Vui lòng thử lại sau.')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Nhân viên"
        description="Quản lý hồ sơ nhân viên tại mọi garage — lọc theo chi nhánh và vai trò."
        action={
          <Link to="/admin/users/staff/new">
            <Button>
              <Plus className="h-4 w-4" />
              Thêm nhân viên
            </Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Tổng nhân viên"
          value={allStaff.length}
          icon={Users}
          accent="brand"
        />
        <StatCard
          label="Đang làm việc"
          value={activeCount}
          icon={UserCheck}
          accent="emerald"
        />
        <StatCard
          label="Ngưng làm việc"
          value={allStaff.length - activeCount}
          icon={UserCog}
          accent="violet"
        />
      </div>

      <div className="mb-6 space-y-4">
        <CustomerSearchPanel
          query={query}
          onChange={setQuery}
          onReset={() => setQuery('')}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="carivo-panel p-4">
            <Label htmlFor="garage-filter" className="mb-1.5">
              Lọc theo garage
            </Label>
            <Select
              id="garage-filter"
              value={garageFilter}
              onChange={(event) => setGarageFilter(event.target.value)}
            >
              <option value="ALL">Tất cả garage</option>
              {garages.map((garage) => (
                <option key={garage.id} value={garage.id}>
                  {garage.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="carivo-panel p-4">
            <Label htmlFor="staff-type-filter" className="mb-1.5">
              Lọc theo vai trò
            </Label>
            <Select
              id="staff-type-filter"
              value={staffTypeFilter}
              onChange={(event) =>
                setStaffTypeFilter(event.target.value as StaffType | 'ALL')
              }
            >
              <option value="ALL">Tất cả vai trò</option>
              {STAFF_TYPES.map((type) => (
                <option key={type} value={type}>
                  {STAFF_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </div>
          <div className="carivo-panel p-4">
            <Label htmlFor="is-active-filter" className="mb-1.5">
              Lọc theo trạng thái
            </Label>
            <Select
              id="is-active-filter"
              value={isActiveFilter === 'ALL' ? 'ALL' : String(isActiveFilter)}
              onChange={(event) => {
                const value = event.target.value
                setIsActiveFilter(value === 'ALL' ? 'ALL' : value === 'true')
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="true">Đang làm việc</option>
              <option value="false">Ngưng làm việc</option>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {staff.length} nhân viên
            {hasActiveFilter ? ' (đã lọc)' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <AdminStaffListTable
            staff={staff}
            hasActiveFilter={hasActiveFilter}
            onToggleActive={setConfirmProfileId}
            onDelete={setDeleteProfileId}
          />
        </CardContent>
      </Card>

      <Modal
        open={Boolean(confirmProfileId && pendingRecord)}
        onClose={() => setConfirmProfileId(null)}
        title={
          pendingRecord?.profile.is_active
            ? 'Ngưng làm việc nhân viên?'
            : 'Kích hoạt lại nhân viên?'
        }
        description={
          pendingRecord
            ? `${pendingRecord.user.full_name} (${pendingRecord.profile.staff_code}) tại ${pendingRecord.garage.name}.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmProfileId(null)}>
            Hủy
          </Button>
          <Button
            variant={pendingRecord?.profile.is_active ? 'danger' : 'primary'}
            onClick={handleConfirmToggle}
            disabled={toggleMutation.isPending}
          >
            Xác nhận
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteProfileId && deletingRecord)}
        onClose={() => setDeleteProfileId(null)}
        title="Xóa hồ sơ nhân viên?"
        description={
          deletingRecord
            ? `${deletingRecord.user.full_name} (${deletingRecord.profile.staff_code}) tại ${deletingRecord.garage.name}.`
            : undefined
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-800">
            Thao tác này không thể hoàn tác. Hồ sơ đang phụ trách ca làm việc sẽ không thể xóa —
            hãy ngưng làm việc trước.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteProfileId(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa hồ sơ'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
