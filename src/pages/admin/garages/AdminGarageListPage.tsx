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
  useToggleAdminGarageStatus,
} from '../../../hooks/api/admin/useAdminGarages'

export function AdminGarageListPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [confirmGarageId, setConfirmGarageId] = useState<string | null>(null)

  const { garages, allGarages, isLoading, isError, error } = useAdminGarages({
    query,
    statusFilter,
  })
  const toggleMutation = useToggleAdminGarageStatus()

  const activeCount = allGarages.filter((garage) => garage.is_active).length
  const cityCount = new Set(allGarages.map((garage) => garage.city)).size
  const hasActiveFilter = query.trim().length > 0 || statusFilter !== 'ALL'

  const pendingGarage = confirmGarageId
    ? allGarages.find((garage) => garage.id === confirmGarageId)
    : undefined

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
    </div>
  )
}
