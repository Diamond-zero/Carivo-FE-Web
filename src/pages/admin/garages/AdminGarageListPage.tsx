import { Building2, MapPin, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminGarageListTable } from '../../../components/admin/garage/AdminGarageListTable'
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
  useAdminGarages,
  useDeleteAdminGarage,
  useToggleAdminGarageStatus,
} from '../../../hooks/api/admin/useAdminGarages'

export function AdminGarageListPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [confirmGarageId, setConfirmGarageId] = useState<string | null>(null)
  const [deleteGarageId, setDeleteGarageId] = useState<string | null>(null)

  const { garages, allGarages, isLoading, isError, error } = useAdminGarages({
    query,
    statusFilter,
  })
  const toggleMutation = useToggleAdminGarageStatus()
  const deleteMutation = useDeleteAdminGarage()

  const activeCount = allGarages.filter((garage) => garage.is_active).length
  const cityCount = new Set(allGarages.map((garage) => garage.city)).size
  const hasActiveFilter = query.trim().length > 0 || statusFilter !== 'ALL'

  const pendingGarage = confirmGarageId
    ? allGarages.find((garage) => garage.id === confirmGarageId)
    : undefined
  const deletingGarage = deleteGarageId
    ? allGarages.find((garage) => garage.id === deleteGarageId)
    : undefined
  const canDeleteGarage = Boolean(
    deletingGarage &&
      !deletingGarage.is_active &&
      deletingGarage.washBayCount === 0,
  )

  const handleConfirmToggle = () => {
    if (!confirmGarageId || !pendingGarage) return

    toggleMutation.mutate(
      { garageId: confirmGarageId, isActive: !pendingGarage.is_active },
      {
        onSuccess: (garage) => {
          setConfirmGarageId(null)
          showToast(
            garage.is_active
              ? `Đã kích hoạt ${garage.name}.`
              : `Đã ngưng hoạt động ${garage.name}.`,
            'success',
          )
        },
        onError: (mutationError) => {
          showToast(
            getApiErrorMessage(mutationError, 'Không thể thay đổi trạng thái garage.'),
            'error',
          )
        },
      },
    )
  }

  const handleConfirmDelete = () => {
    if (!deleteGarageId || !deletingGarage) return

    deleteMutation.mutate(deleteGarageId, {
      onSuccess: () => {
        setDeleteGarageId(null)
        showToast(`Đã xóa garage ${deletingGarage.name}.`, 'success')
      },
      onError: (mutationError) => {
        showToast(
          getApiErrorMessage(mutationError, 'Không thể xóa garage. Hãy thử ngưng hoạt động trước.'),
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
        <PageHeader title="Chi nhánh garage" description="Quản lý chi nhánh garage." />
        <EmptyState
          icon={Building2}
          title="Không thể tải danh sách garage"
          description={getApiErrorMessage(error, 'Vui lòng thử lại sau.')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Chi nhánh garage"
        description="Quản lý chi nhánh garage — địa chỉ, giờ mở cửa và cấu hình slot đặt lịch."
        action={
          <Link to="/admin/garages/new">
            <Button>
              <Plus className="h-4 w-4" />
              Thêm garage
            </Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Tổng garage"
          value={allGarages.length}
          icon={Building2}
          accent="brand"
        />
        <StatCard
          label="Đang hoạt động"
          value={activeCount}
          icon={Building2}
          accent="emerald"
        />
        <StatCard
          label="Thành phố"
          value={cityCount}
          icon={MapPin}
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
          <Label htmlFor="garage-status-filter" className="mb-1.5">
            Lọc theo trạng thái
          </Label>
          <Select
            id="garage-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
            }
          >
            <option value="ALL">Tất cả</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Ngưng hoạt động</option>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {garages.length} garage
            {hasActiveFilter ? ' (đã lọc)' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <AdminGarageListTable
            garages={garages}
            hasActiveFilter={hasActiveFilter}
            onToggleActive={setConfirmGarageId}
            onDelete={setDeleteGarageId}
          />
        </CardContent>
      </Card>

      <Modal
        open={Boolean(confirmGarageId && pendingGarage)}
        onClose={() => setConfirmGarageId(null)}
        title={
          pendingGarage?.is_active ? 'Ngưng hoạt động garage?' : 'Kích hoạt lại garage?'
        }
        description={
          pendingGarage
            ? `${pendingGarage.name} (${pendingGarage.garage_code}) — ${pendingGarage.city}.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmGarageId(null)}>
            Hủy
          </Button>
          <Button
            variant={pendingGarage?.is_active ? 'danger' : 'primary'}
            onClick={handleConfirmToggle}
            disabled={toggleMutation.isPending}
          >
            Xác nhận
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteGarageId && deletingGarage)}
        onClose={() => setDeleteGarageId(null)}
        title="Xóa vĩnh viễn garage?"
        description={
          deletingGarage
            ? `${deletingGarage.name} (${deletingGarage.garage_code}) — ${deletingGarage.city}.`
            : undefined
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-800">
            {deletingGarage?.is_active
              ? 'Garage đang hoạt động. Hãy ngưng hoạt động trước khi yêu cầu xóa vĩnh viễn.'
              : deletingGarage && deletingGarage.washBayCount > 0
                ? `Garage còn ${deletingGarage.washBayCount} buồng rửa nên không thể xóa vĩnh viễn. Hãy giữ garage ở trạng thái ngưng hoạt động để bảo toàn dữ liệu.`
                : 'Chỉ garage chưa có nhân sự, cấu hình giá, booking hoặc dữ liệu vận hành mới có thể xóa. Thao tác này không thể hoàn tác.'}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteGarageId(null)}>
              Hủy
            </Button>
            {deletingGarage?.is_active ? (
              <Button
                variant="danger"
                onClick={() => {
                  setDeleteGarageId(null)
                  setConfirmGarageId(deletingGarage.id)
                }}
              >
                Ngưng hoạt động
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending || !canDeleteGarage}
              >
                {deleteMutation.isPending
                  ? 'Đang xóa...'
                  : canDeleteGarage
                    ? 'Xóa vĩnh viễn'
                    : 'Không thể xóa'}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
