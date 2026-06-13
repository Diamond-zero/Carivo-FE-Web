import { Droplets, Plus, Wrench } from 'lucide-react'
import { useMemo, useState } from 'react'
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
import { Label } from '../../../components/ui/Label'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { WASH_BAY_STATUS_LABELS, VEHICLE_TYPE_LABELS } from '../../../constants/washBayStatus'
import { useToast } from '../../../contexts/ToastContext'
import { useInitialPageSkeleton } from '../../../hooks/useInitialPageSkeleton'
import type {
  AdminWashBayCreateValues,
  AdminWashBayFormValues,
} from '../../../lib/validations/adminWashBay'
import { getAdminGaragesFromStore } from '../../../mocks/admin/adminGarageStore'
import {
  createAdminWashBay,
  getAdminWashBayById,
  toggleAdminWashBayActive,
  updateAdminWashBay,
} from '../../../mocks/admin/adminWashBayStore'
import type { VehicleType, WashBayStatus } from '../../../types/washBay'
import { searchAdminWashBays } from '../../../utils/adminWashBayLookup'

type FormMode = 'create' | 'edit' | null

export function AdminWashBayManagementPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [garageFilter, setGarageFilter] = useState<string | 'ALL'>('ALL')
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<VehicleType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<WashBayStatus | 'ALL'>('ALL')
  const [refreshKey, setRefreshKey] = useState(0)
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingBayId, setEditingBayId] = useState<string | null>(null)
  const [confirmBayId, setConfirmBayId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isLoading = useInitialPageSkeleton(280)

  const garages = useMemo(() => getAdminGaragesFromStore(), [refreshKey])

  const washBays = useMemo(
    () => searchAdminWashBays(query, garageFilter, vehicleTypeFilter, statusFilter),
    [query, garageFilter, vehicleTypeFilter, statusFilter, refreshKey],
  )

  const allWashBays = useMemo(() => searchAdminWashBays('', 'ALL', 'ALL', 'ALL'), [refreshKey])
  const availableCount = allWashBays.filter((bay) => bay.status === 'AVAILABLE').length
  const occupiedCount = allWashBays.filter((bay) => bay.status === 'OCCUPIED').length
  const maintenanceCount = allWashBays.filter((bay) => bay.status === 'MAINTENANCE').length
  const hasActiveFilter =
    query.trim().length > 0 ||
    garageFilter !== 'ALL' ||
    vehicleTypeFilter !== 'ALL' ||
    statusFilter !== 'ALL'

  const editingBay = editingBayId ? getAdminWashBayById(editingBayId) : undefined
  const pendingBay = confirmBayId ? getAdminWashBayById(confirmBayId) : undefined

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
    setIsSubmitting(true)

    try {
      if (formMode === 'create') {
        const createValues = values as AdminWashBayCreateValues
        const result = createAdminWashBay(createValues)
        if (!result.ok) {
          showToast(result.message, 'error')
          return
        }

        showToast(`Đã tạo buồng rửa ${result.bay.name}.`, 'success')
        setRefreshKey((value) => value + 1)
        closeForm()
        return
      }

      if (!editingBayId || !editingBay) return

      const editValues = values as AdminWashBayFormValues
      const result = updateAdminWashBay(editingBayId, {
        garage_id: editValues.garage_id,
        name: editValues.name,
        bay_code: editValues.bay_code,
        vehicle_type: editValues.vehicle_type,
        status: editingBay.status === 'OCCUPIED' ? 'OCCUPIED' : editValues.status,
        is_active: editingBay.status === 'OCCUPIED' ? editingBay.is_active : editValues.is_active,
      })

      if (!result.ok) {
        showToast(result.message, 'error')
        return
      }

      showToast(`Đã cập nhật ${result.bay.name}.`, 'success')
      setRefreshKey((value) => value + 1)
      closeForm()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmToggle = () => {
    if (!confirmBayId) return

    const result = toggleAdminWashBayActive(confirmBayId)
    setConfirmBayId(null)

    if (!result.ok) {
      showToast(result.message, 'error')
      return
    }

    setRefreshKey((value) => value + 1)
    showToast(
      result.bay.is_active
        ? `Đã bật buồng rửa ${result.bay.name}.`
        : `Đã tắt buồng rửa ${result.bay.name}.`,
      'success',
    )
  }

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Admin"
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
                ? `${pendingBay.name} (${pendingBay.bay_code}) tại ${getAdminGaragesFromStore().find((g) => g.id === pendingBay.garage_id)?.name}.`
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
              >
                Xác nhận
              </Button>
            </div>
          </Modal>
        </>
      )}
    </div>
  )
}
