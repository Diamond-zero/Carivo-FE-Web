import { Car, Plus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminVehicleFormModal } from '../../../components/admin/vehicle/AdminVehicleFormModal'
import { AdminVehicleListTable } from '../../../components/admin/vehicle/AdminVehicleListTable'
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
import { useAdminCustomers } from '../../../hooks/api/admin/useAdminCustomers'
import {
  useAdminVehicles,
  useCreateAdminVehicle,
  useDeleteAdminVehicle,
  useUpdateAdminVehicle,
} from '../../../hooks/api/admin/useAdminVehicles'
import type { Vehicle } from '../../../types/vehicle'
import type { AdminVehicleCreateValues, VehicleFormValues } from '../../../lib/validations/adminVehicle'
import { normalizeSearchText } from '../../../utils/booking'

type FormMode = 'create' | 'edit' | null

export function AdminVehicleListPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<'ALL' | 'MOTORBIKE' | 'CAR'>(
    'ALL',
  )
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE')
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null)
  const [deleteVehicleId, setDeleteVehicleId] = useState<string | null>(null)

  const { allCustomers } = useAdminCustomers()
  const {
    vehicles: allVehiclesData,
    isLoading,
    isError,
    error,
  } = useAdminVehicles({
    search: query.trim() || undefined,
    vehicle_type: vehicleTypeFilter === 'ALL' ? undefined : vehicleTypeFilter,
  })
  const editingVehicleQuery = useAdminVehicles()
  const createMutation = useCreateAdminVehicle()
  const updateMutation = useUpdateAdminVehicle()
  const deleteMutation = useDeleteAdminVehicle()

  const allVehicles = useMemo(() => allVehiclesData ?? [], [allVehiclesData])

  const filteredVehicles = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query.trim())
    return allVehicles.filter((vehicle) => {
      if (
        vehicleTypeFilter !== 'ALL' &&
        vehicle.vehicle_type !== vehicleTypeFilter
      )
        return false
      if (activeFilter === 'ACTIVE' && !vehicle.is_active) return false
      if (activeFilter === 'INACTIVE' && vehicle.is_active) return false
      if (!normalizedQuery) return true
      return (
        normalizeSearchText(vehicle.raw_license_plate).includes(normalizedQuery) ||
        normalizeSearchText(vehicle.normalized_license_plate ?? '').includes(normalizedQuery) ||
        normalizeSearchText(vehicle.brand ?? '').includes(normalizedQuery) ||
        normalizeSearchText(vehicle.model ?? '').includes(normalizedQuery) ||
        normalizeSearchText(vehicle.color ?? '').includes(normalizedQuery)
      )
    })
  }, [allVehicles, query, vehicleTypeFilter, activeFilter])

  const customerNameById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const customer of allCustomers) {
      map[customer.user.id] = `${customer.user.full_name} (${customer.user.phone})`
    }
    return map
  }, [allCustomers])

  const editingVehicle = useMemo(() => {
    if (!editingVehicleId) return undefined
    return allVehicles.find((v) => v.id === editingVehicleId)
  }, [allVehicles, editingVehicleId])
  // ensure useAdminVehicles query stays warm while modal opens
  void editingVehicleQuery

  const deletingVehicle = deleteVehicleId
    ? allVehicles.find((v) => v.id === deleteVehicleId)
    : undefined

  const activeCount = allVehicles.filter((v) => v.is_active).length
  const motorbikeCount = allVehicles.filter((v) => v.vehicle_type === 'MOTORBIKE').length
  const carCount = allVehicles.filter((v) => v.vehicle_type === 'CAR').length
  const hasActiveFilter =
    query.trim().length > 0 ||
    vehicleTypeFilter !== 'ALL' ||
    activeFilter !== 'ALL'

  const openCreate = () => {
    setEditingVehicleId(null)
    setFormMode('create')
  }

  const openEdit = (vehicleId: string) => {
    setEditingVehicleId(vehicleId)
    setFormMode('edit')
  }

  const closeForm = () => {
    setFormMode(null)
    setEditingVehicleId(null)
  }

  const handleFormSubmit = async (
    values: VehicleFormValues | AdminVehicleCreateValues,
  ) => {
    const payload: VehicleFormValues = {
      raw_license_plate: values.raw_license_plate,
      vehicle_type: values.vehicle_type,
      engine_type: values.engine_type,
      motorbike_cc_group: values.vehicle_type === 'MOTORBIKE'
        ? values.motorbike_cc_group ?? null
        : null,
      car_body_type: values.vehicle_type === 'CAR' ? values.car_body_type ?? null : null,
      seat_count: values.vehicle_type === 'CAR' ? values.seat_count ?? null : null,
      brand: values.brand || undefined,
      model: values.model || undefined,
      color: values.color || undefined,
      is_default: values.is_default ?? false,
      is_active: values.is_active ?? true,
    }

    if (formMode === 'create') {
      createMutation.mutate(
        { ...(values as AdminVehicleCreateValues), ...payload },
        {
          onSuccess: (created) => {
            showToast(`Đã thêm phương tiện ${created.raw_license_plate}.`, 'success')
            closeForm()
          },
          onError: (mutationError) => {
            showToast(
              getApiErrorMessage(mutationError, 'Không thể thêm phương tiện.'),
              'error',
            )
          },
        },
      )
      return
    }

    if (!editingVehicleId) return
    updateMutation.mutate(
      { vehicleId: editingVehicleId, payload },
      {
        onSuccess: (updated) => {
          showToast(`Đã cập nhật phương tiện ${updated.raw_license_plate}.`, 'success')
          closeForm()
        },
        onError: (mutationError) => {
          showToast(
            getApiErrorMessage(mutationError, 'Không thể cập nhật phương tiện.'),
            'error',
          )
        },
      },
    )
  }

  const handleConfirmDelete = () => {
    if (!deleteVehicleId || !deletingVehicle) return

    deleteMutation.mutate(deleteVehicleId, {
      onSuccess: () => {
        setDeleteVehicleId(null)
        showToast(`Đã xóa phương tiện ${deletingVehicle.raw_license_plate}.`, 'success')
      },
      onError: (mutationError) => {
        showToast(
          getApiErrorMessage(
            mutationError,
            'Không thể xóa phương tiện. Hãy ngưng hoạt động trước.',
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
        <PageHeader
          title="Phương tiện khách hàng"
          description="Quản lý toàn bộ phương tiện đăng ký trong hệ thống Carivo."
        />
        <EmptyState
          icon={Car}
          title="Không thể tải danh sách phương tiện"
          description={getApiErrorMessage(error, 'Vui lòng thử lại sau.')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Phương tiện khách hàng"
        description="Quản lý phương tiện toàn hệ thống — biển số, loại xe và thông tin kỹ thuật."
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Thêm phương tiện
            </Button>
            <Link to="/admin/users/customers">
              <Button variant="secondary">
                <Users className="h-4 w-4" />
                Khách hàng
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng phương tiện" value={allVehicles.length} icon={Car} accent="brand" />
        <StatCard label="Đang hoạt động" value={activeCount} icon={Car} accent="emerald" />
        <StatCard label="Ô tô" value={carCount} icon={Car} accent="indigo" />
        <StatCard label="Xe máy" value={motorbikeCount} icon={Car} accent="amber" />
      </div>

      <div className="mb-6 space-y-4">
        <CustomerSearchPanel
          query={query}
          onChange={setQuery}
          onReset={() => setQuery('')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="carivo-panel p-4">
            <Label htmlFor="vehicle-type-filter" className="mb-1.5">
              Lọc theo loại xe
            </Label>
            <Select
              id="vehicle-type-filter"
              value={vehicleTypeFilter}
              onChange={(event) =>
                setVehicleTypeFilter(event.target.value as 'ALL' | 'MOTORBIKE' | 'CAR')
              }
            >
              <option value="ALL">Tất cả loại xe</option>
              <option value="CAR">Ô tô</option>
              <option value="MOTORBIKE">Xe máy</option>
            </Select>
          </div>
          <div className="carivo-panel p-4">
            <Label htmlFor="vehicle-status-filter" className="mb-1.5">
              Lọc theo trạng thái
            </Label>
            <Select
              id="vehicle-status-filter"
              value={activeFilter}
              onChange={(event) =>
                setActiveFilter(event.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
              }
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang dùng</option>
              <option value="INACTIVE">Ngưng</option>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {filteredVehicles.length} phương tiện
            {hasActiveFilter ? ' (đã lọc)' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <AdminVehicleListTable
            vehicles={filteredVehicles}
            customerNameById={customerNameById}
            hasActiveFilter={hasActiveFilter}
            onEdit={openEdit}
            onDelete={setDeleteVehicleId}
          />
        </CardContent>
      </Card>

      <AdminVehicleFormModal
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initialVehicle={editingVehicle as Vehicle | undefined}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <Modal
        open={Boolean(deleteVehicleId && deletingVehicle)}
        onClose={() => setDeleteVehicleId(null)}
        title="Xóa phương tiện?"
        description={
          deletingVehicle
            ? `${deletingVehicle.raw_license_plate}${deletingVehicle.customer_id ? ` — khách ${customerNameById[deletingVehicle.customer_id] ?? deletingVehicle.customer_id}` : ''}`
            : undefined
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-800">
            Thao tác này không thể hoàn tác. Xe đang gắn với booking hoặc lịch sử rửa sẽ không thể
            xóa — hãy ngưng hoạt động trước.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteVehicleId(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa phương tiện'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}