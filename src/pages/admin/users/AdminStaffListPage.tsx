import { Plus, UserCheck, UserCog, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminStaffListTable } from '../../../components/admin/staff/AdminStaffListTable'
import { AdminStaffTypeChangeRequestModal } from '../../../components/admin/staff/AdminStaffTypeChangeRequestModal'
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

const PAGE_SIZE = 20

export function AdminStaffListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [garageFilter, setGarageFilter] = useState<string | 'ALL'>('ALL')
  const [staffTypeFilter, setStaffTypeFilter] = useState<StaffType | 'ALL'>('ALL')
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | 'ALL'>('ALL')
  const [confirmProfileId, setConfirmProfileId] = useState<string | null>(null)
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null)
  const [transferProfileId, setTransferProfileId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const { allGarages: garages } = useAdminGarages()
  const {
    staff,
    meta,
    totalStaff,
    activeStaffCount,
    inactiveStaffCount,
    isLoading,
    isFetching,
    isError,
    error,
  } = useAdminStaff(
    {
      query,
      garageFilter,
      staffTypeFilter,
      isActiveFilter,
    },
    page,
    PAGE_SIZE,
  )
  const toggleMutation = useToggleAdminStaffStatus()
  const deleteMutation = useDeleteAdminStaff()

  const totalPages = Math.max(meta?.total_pages ?? 1, 1)
  const hasActiveFilter =
    query.trim().length > 0 ||
    garageFilter !== 'ALL' ||
    staffTypeFilter !== 'ALL' ||
    isActiveFilter !== 'ALL'

  const pendingRecord = confirmProfileId
    ? staff.find((record) => record.profile.id === confirmProfileId)
    : undefined
  const deletingRecord = deleteProfileId
    ? staff.find((record) => record.profile.id === deleteProfileId)
    : undefined
  const transferRecord = transferProfileId
    ? staff.find((record) => record.profile.id === transferProfileId)
    : undefined

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

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
          value={totalStaff}
          icon={Users}
          accent="brand"
        />
        <StatCard
          label="Đang làm việc"
          value={activeStaffCount}
          icon={UserCheck}
          accent="emerald"
        />
        <StatCard
          label="Ngưng làm việc"
          value={inactiveStaffCount}
          icon={UserCog}
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
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="carivo-panel p-4">
            <Label htmlFor="garage-filter" className="mb-1.5">
              Lọc theo garage
            </Label>
            <Select
              id="garage-filter"
              value={garageFilter}
              onChange={(event) => {
                setPage(1)
                setGarageFilter(event.target.value)
              }}
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
              onChange={(event) => {
                setPage(1)
                setStaffTypeFilter(event.target.value as StaffType | 'ALL')
              }}
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
                setPage(1)
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
            {meta?.total ?? staff.length} nhân viên
            {hasActiveFilter ? ' (đã lọc)' : ''}
            {meta ? ` · Trang ${meta.page}/${totalPages}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <AdminStaffListTable
            staff={staff}
            hasActiveFilter={hasActiveFilter}
            onToggleActive={setConfirmProfileId}
            onDelete={setDeleteProfileId}
            onTransfer={setTransferProfileId}
          />
        </CardContent>
        {meta && totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-sm text-slate-600">
            <span>
              Trang {meta.page} / {totalPages} · {meta.total} nhân viên
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

      <AdminStaffTypeChangeRequestModal
        open={Boolean(transferRecord)}
        record={transferRecord ?? null}
        onClose={() => setTransferProfileId(null)}
        onSubmitted={(created) => {
          setTransferProfileId(null)
          showToast(
            `Đã tạo yêu cầu điều chuyển ${created.id.slice(0, 8)} — chuyển sang duyệt.`,
            'success',
          )
          navigate(`/admin/staff-type-change-requests/${created.id}`)
        }}
      />
    </div>
  )
}
