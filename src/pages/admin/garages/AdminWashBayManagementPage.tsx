import { Droplets, Plus, Wrench } from 'lucide-react'
import { useState } from 'react'
import { getApiErrorMessage } from '../../../api/client'
import { AdminWashBayFormModal } from '../../../components/admin/washBay/AdminWashBayFormModal'
import { AdminWashBayListTable } from '../../../components/admin/washBay/AdminWashBayListTable'
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
import { WASH_BAY_STATUS_LABELS, VEHICLE_TYPE_LABELS } from '../../../constants/washBayStatus'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminGarages } from '../../../hooks/api/admin/useAdminGarages'
import {
  useAdminWashBay,
  useAdminWashBays,
  useCreateAdminWashBay,
  useToggleAdminWashBayStatus,
  useUpdateAdminWashBay,
} from '../../../hooks/api/admin/useAdminWashBays'
import type {
  AdminWashBayCreateValues,
  AdminWashBayFormValues,
} from '../../../lib/validations/adminWashBay'
import type { VehicleType, WashBayStatus } from '../../../types/washBay'

type FormMode = 'create' | 'edit' | null

export function AdminWashBayManagementPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [garageFilter, setGarageFilter] = useState<string | 'ALL'>('ALL')
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<VehicleType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<WashBayStatus | 'ALL'>('ALL')
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingBayId, setEditingBayId] = useState<string | null>(null)
  const [confirmBayId, setConfirmBayId] = useState<string | null>(null)

  const { allGarages: garages } = useAdminGarages()
  const { washBays, allWashBays, isLoading, isError, error } = useAdminWashBays({
    query,
    garageFilter,
    vehicleTypeFilter,
    statusFilter,
  })
  const editingBayQuery = useAdminWashBay(formMode === 'edit' ? editingBayId ?? undefined : undefined)
  const createMutation = useCreateAdminWashBay()
  const updateMutation = useUpdateAdminWashBay()
  const toggleMutation = useToggleAdminWashBayStatus()

  const availableCount = allWashBays.filter((bay) => bay.status === 'AVAILABLE').length
  const occupiedCount = allWashBays.filter((bay) => bay.status === 'OCCUPIED').length
  const maintenanceCount = allWashBays.filter((bay) => bay.status === 'MAINTENANCE').length
  const hasActiveFilter =
    query.trim().length > 0 ||
    garageFilter !== 'ALL' ||
    vehicleTypeFilter !== 'ALL' ||
    statusFilter !== 'ALL'

  const editingBay = editingBayQuery.data
  const pendingBay = confirmBayId
    ? allWashBays.find((bay) => bay.id === confirmBayId)
    : undefined
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const openCreate = () => {
    setEditingBayId(null)
    setFormMode('create')
  }

  const openEdit = (bayId: string) => {
    setEditingBayId(bayId)
    setFormMode('edit')
  }

  const closeForm = () => {
    setFormMode(null)
    setEditingBayId(null)
  }

  const handleFormSubmit = async (
    values: AdminWashBayFormValues | AdminWashBayCreateValues,
  ) => {
    if (formMode === 'create') {
      const createValues = values as AdminWashBayCreateValues
      createMutation.mutate(createValues, {
        onSuccess: (bay) => {
          showToast(`Đã tạo buồng rửa ${bay.name}.`, 'success')
          closeForm()
        },
        onError: (mutationError) => {
          showToast(
            getApiErrorMessage(mutationError, 'Không thể tạo buồng rửa.'),
            'error',
          )
        },
      })
      return
    }

    if (!editingBayId || !editingBay) return

    const editValues = values as AdminWashBayFormValues
    updateMutation.mutate(
      {
        washBayId: editingBayId,
        payload: {
          name: editValues.name,
          bay_code: editValues.bay_code,
          vehicle_type: editValues.vehicle_type,
          status: editingBay.status === 'OCCUPIED' ? 'OCCUPIED' : editValues.status,
          is_active:
            editingBay.status === 'OCCUPIED' ? editingBay.is_active : editValues.is_active,
        },
      },
      {
        onSuccess: (bay) => {
          showToast(`Đã cập nhật ${bay.name}.`, 'success')
          closeForm()
        },
        onError: (mutationError) => {
          showToast(
            getApiErrorMessage(mutationError, 'Không thể cập nhật buồng rửa.'),
            'error',
          )
        },
      },
    )
  }

  const handleConfirmToggle = () => {
    if (!confirmBayId || !pendingBay) return

    toggleMutation.mutate(
      { washBayId: confirmBayId, isActive: !pendingBay.is_active },
      {
        onSuccess: (bay) => {
          setConfirmBayId(null)
          showToast(
            bay.is_active
              ? `Đã bật buồng rửa ${bay.name}.`
              : `Đã tắt buồng rửa ${bay.name}.`,
            'success',
          )
        },
        onError: (mutationError) => {
          showToast(
            getApiErrorMessage(mutationError, 'Không thể thay đổi trạng thái buồng rửa.'),
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
        <PageHeader title="Buồng rửa" description="Quản lý buồng rửa toàn hệ thống." />
        <EmptyState
          icon={Droplets}
          title="Không thể tải danh sách buồng rửa"
          description={getApiErrorMessage(error, 'Vui lòng thử lại sau.')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Buồng rửa"
        description="Quản lý buồng rửa toàn hệ thống — cấu hình theo garage, loại xe và trạng thái vận hành."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Thêm buồng rửa
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng buồng rửa"
          value={allWashBays.length}
          icon={Droplets}
          accent="brand"
        />
        <StatCard
          label="Đang trống"
          value={availableCount}
          icon={Droplets}
          accent="emerald"
        />
        <StatCard
          label="Đang sử dụng"
          value={occupiedCount}
          icon={Droplets}
          accent="indigo"
        />
        <StatCard
          label="Bảo trì"
          value={maintenanceCount}
          icon={Wrench}
          accent="amber"
        />
      </div>

      <div className="mb-6 space-y-4">
        <CustomerSearchPanel
          query={query}
          onChange={setQuery}
          onReset={() => setQuery('')}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="carivo-panel p-4">
            <Label htmlFor="wash-bay-garage-filter" className="mb-1.5">
              Lọc theo garage
            </Label>
            <Select
              id="wash-bay-garage-filter"
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
            <Label htmlFor="wash-bay-vehicle-filter" className="mb-1.5">
              Lọc theo loại xe
            </Label>
            <Select
              id="wash-bay-vehicle-filter"
              value={vehicleTypeFilter}
              onChange={(event) =>
                setVehicleTypeFilter(event.target.value as VehicleType | 'ALL')
              }
            >
              <option value="ALL">Tất cả loại xe</option>
              <option value="CAR">{VEHICLE_TYPE_LABELS.CAR}</option>
              <option value="MOTORBIKE">{VEHICLE_TYPE_LABELS.MOTORBIKE}</option>
            </Select>
          </div>
          <div className="carivo-panel p-4">
            <Label htmlFor="wash-bay-status-filter" className="mb-1.5">
              Lọc theo trạng thái
            </Label>
            <Select
              id="wash-bay-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as WashBayStatus | 'ALL')
              }
            >
              <option value="ALL">Tất cả trạng thái</option>
              {(Object.keys(WASH_BAY_STATUS_LABELS) as WashBayStatus[]).map((status) => (
                <option key={status} value={status}>
                  {WASH_BAY_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {washBays.length} buồng rửa
            {hasActiveFilter ? ' (đã lọc)' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <AdminWashBayListTable
            washBays={washBays}
            hasActiveFilter={hasActiveFilter}
            onEdit={openEdit}
            onToggleActive={setConfirmBayId}
          />
        </CardContent>
      </Card>

      <AdminWashBayFormModal
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initialBay={editingBay}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <Modal
        open={Boolean(confirmBayId && pendingBay)}
        onClose={() => setConfirmBayId(null)}
        title={pendingBay?.is_active ? 'Tắt buồng rửa?' : 'Bật buồng rửa?'}
        description={
          pendingBay
            ? `${pendingBay.name} (${pendingBay.bay_code}) tại ${pendingBay.garage_name}.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmBayId(null)}>
            Hủy
          </Button>
          <Button
            variant={pendingBay?.is_active ? 'danger' : 'primary'}
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
