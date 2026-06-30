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
  useDeleteAdminWashBay,
  useUpdateAdminWashBay,
  useUpdateAdminWashBayStatus,
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
  const [statusTarget, setStatusTarget] = useState<{
    bayId: string
    status: 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE'
  } | null>(null)
  const [deleteBayId, setDeleteBayId] = useState<string | null>(null)

  const { allGarages: garages } = useAdminGarages()
  const { washBays, allWashBays, isLoading, isError, error } = useAdminWashBays({
    query,
    garageFilter,
    vehicleTypeFilter,
    statusFilter,
  })
  const editingBayQuery = useAdminWashBay(editingBayId ?? undefined)
  const createMutation = useCreateAdminWashBay()
  const updateMutation = useUpdateAdminWashBay()
  const statusMutation = useUpdateAdminWashBayStatus()
  const deleteMutation = useDeleteAdminWashBay()

  const availableCount = allWashBays.filter((bay) => bay.status === 'AVAILABLE').length
  const occupiedCount = allWashBays.filter((bay) => bay.status === 'OCCUPIED').length
  const maintenanceCount = allWashBays.filter((bay) => bay.status === 'MAINTENANCE').length
  const hasActiveFilter =
    query.trim().length > 0 ||
    garageFilter !== 'ALL' ||
    vehicleTypeFilter !== 'ALL' ||
    statusFilter !== 'ALL'

  const editingBay = editingBayQuery.data
  const pendingStatusBay = statusTarget
    ? allWashBays.find((bay) => bay.id === statusTarget.bayId)
    : undefined
  const pendingDeleteBay = deleteBayId
    ? allWashBays.find((bay) => bay.id === deleteBayId)
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
      createMutation.mutate({ ...createValues, bay_code: createValues.bay_code.trim() }, {
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
          bay_code: editValues.bay_code.trim(),
          vehicle_type: editValues.vehicle_type,
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

  const handleConfirmStatus = () => {
    if (!statusTarget) return

    statusMutation.mutate(
      { washBayId: statusTarget.bayId, status: statusTarget.status },
      {
        onSuccess: (bay) => {
          setStatusTarget(null)
          showToast(
            `Đã chuyển ${bay.name} sang trạng thái ${WASH_BAY_STATUS_LABELS[bay.status]}.`,
            'success',
          )
        },
        onError: (mutationError) => {
          showToast(
            getApiErrorMessage(mutationError, 'Không thể cập nhật trạng thái vận hành.'),
            'error',
          )
        },
      },
    )
  }

  const handleRequestStatusChange = (bayId: string) => {
    const bay = allWashBays.find((item) => item.id === bayId)
    if (!bay) return
    const nextStatus: WashBayStatus =
      bay.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE'
    setStatusTarget({ bayId, status: nextStatus })
  }

  const handleConfirmDelete = () => {
    if (!deleteBayId || !pendingDeleteBay) return

    deleteMutation.mutate(deleteBayId, {
      onSuccess: () => {
        setDeleteBayId(null)
        showToast(
          `Đã xóa vĩnh viễn buồng rửa ${pendingDeleteBay.name} khỏi hệ thống.`,
          'success',
        )
      },
      onError: (mutationError) => {
        showToast(
          getApiErrorMessage(
            mutationError,
            'Không thể xóa buồng rửa. Vui lòng tắt hoạt động và đảm bảo không còn booking đang hoạt động.',
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
            onChangeStatus={handleRequestStatusChange}
            onDelete={setDeleteBayId}
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
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        title="Đổi trạng thái vận hành buồng rửa"
        description={
          statusTarget && pendingStatusBay
            ? `${pendingStatusBay.name} (${pendingStatusBay.bay_code}) sẽ chuyển sang trạng thái "${WASH_BAY_STATUS_LABELS[statusTarget.status]}".`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setStatusTarget(null)}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirmStatus}
            disabled={statusMutation.isPending}
          >
            {statusMutation.isPending ? 'Đang cập nhật...' : 'Xác nhận'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteBayId && pendingDeleteBay)}
        onClose={() => setDeleteBayId(null)}
        title="Xóa buồng rửa?"
        description={
          pendingDeleteBay
            ? `${pendingDeleteBay.name} (${pendingDeleteBay.bay_code}) tại ${pendingDeleteBay.garage_name} sẽ bị xóa vĩnh viễn khỏi hệ thống.`
            : undefined
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-800">
            <strong>Xóa vĩnh viễn:</strong> buồng rửa sẽ bị xoá khỏi cơ sở dữ liệu và không
            còn xuất hiện trong danh sách. Nếu chỉ muốn ngưng sử dụng tạm thời, hãy dùng thao
            tác <em>Tắt</em>.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteBayId(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa buồng rửa'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
