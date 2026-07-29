import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Car, Pencil, Plus } from 'lucide-react'

import { Card } from '../../../components/ui/Card'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Modal } from '../../../components/ui/Modal'
import { getApiErrorMessage } from '../../../api/client'
import { AdminVehicleFormModal } from '../../../components/admin/vehicle/AdminVehicleFormModal'
import { useAdminVehicles } from '../../../hooks/api/admin/useAdminVehicles'
import { useAdminCustomer } from '../../../hooks/api/admin/useAdminCustomers'
import {
  useCreateAdminVehicle,
  useDeleteAdminVehicle,
  useUpdateAdminVehicle,
} from '../../../hooks/api/admin/useAdminVehicles'
import { useToast } from '../../../contexts/ToastContext'
import type { Vehicle } from '../../../types/vehicle'
import type {
  AdminVehicleCreateValues,
  VehicleFormValues,
} from '../../../lib/validations/adminVehicle'

type FormMode = 'create' | 'edit' | null

export function AdminCustomerVehiclesPage() {
  const { id } = useParams<{ id: string }>()
  const customerId = id ?? ''
  const { showToast } = useToast()
  const { customer } = useAdminCustomer(customerId)
  const { vehicles, isLoading } = useAdminVehicles({
    customer_id: customerId,
    is_active: true,
  })
  const createMutation = useCreateAdminVehicle()
  const updateMutation = useUpdateAdminVehicle()
  const deleteMutation = useDeleteAdminVehicle()

  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deleteVehicleId, setDeleteVehicleId] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const list = vehicles ?? []
    return {
      cars: list.filter((v) => v.vehicle_type === 'CAR'),
      bikes: list.filter((v) => v.vehicle_type === 'MOTORBIKE'),
    }
  }, [vehicles])

  const deletingVehicle = deleteVehicleId
    ? vehicles?.find((v) => v.id === deleteVehicleId)
    : undefined

  const openCreate = () => {
    setEditingVehicle(null)
    setFormMode('create')
  }

  const openEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormMode('edit')
  }

  const closeForm = () => {
    setFormMode(null)
    setEditingVehicle(null)
  }

  const handleSubmit = async (
    values: VehicleFormValues | AdminVehicleCreateValues,
  ) => {
    const basePayload: VehicleFormValues = {
      raw_license_plate: values.raw_license_plate,
      vehicle_type: values.vehicle_type,
      engine_type: values.engine_type,
      motorbike_cc_group:
        values.vehicle_type === 'MOTORBIKE' ? values.motorbike_cc_group ?? null : null,
      car_body_type:
        values.vehicle_type === 'CAR' ? values.car_body_type ?? null : null,
      seat_count: values.vehicle_type === 'CAR' ? values.seat_count ?? null : null,
      brand: values.brand || undefined,
      model: values.model || undefined,
      color: values.color || undefined,
      is_default: values.is_default ?? false,
      is_active: values.is_active ?? true,
    }

    if (formMode === 'create') {
      createMutation.mutate(
        { ...(values as AdminVehicleCreateValues), ...basePayload },
        {
          onSuccess: (created) => {
            showToast(`Đã thêm phương tiện ${created.raw_license_plate}.`, 'success')
            closeForm()
          },
          onError: (err) => {
            showToast(getApiErrorMessage(err, 'Không thể thêm phương tiện.'), 'error')
          },
        },
      )
      return
    }

    if (!editingVehicle) return
    updateMutation.mutate(
      { vehicleId: editingVehicle.id, payload: basePayload },
      {
        onSuccess: (updated) => {
          showToast(`Đã cập nhật phương tiện ${updated.raw_license_plate}.`, 'success')
          closeForm()
        },
        onError: (err) => {
          showToast(getApiErrorMessage(err, 'Không thể cập nhật phương tiện.'), 'error')
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
      onError: (err) => {
        showToast(
          getApiErrorMessage(err, 'Không thể xóa phương tiện. Hãy ngưng hoạt động trước.'),
          'error',
        )
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Phương tiện của ${customer?.full_name ?? 'khách hàng'}`}
        description="Quản lý danh sách xe đã đăng ký cho khách hàng"
        action={
          <div className="flex items-center gap-2">
            <Link to={`/admin/users/customers/${customerId}`}>
              <Button variant="secondary">
                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
              </Button>
            </Link>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Thêm phương tiện
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <Card className="p-8 text-center text-sm text-slate-500">Đang tải danh sách phương tiện...</Card>
      ) : !vehicles || vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Chưa có phương tiện"
          description="Khách hàng này chưa đăng ký phương tiện nào trong hệ thống."
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Thêm phương tiện
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <VehicleGroup title="Ô tô" vehicles={grouped.cars} onEdit={openEdit} />
          <VehicleGroup title="Xe máy" vehicles={grouped.bikes} onEdit={openEdit} />
        </div>
      )}

      <AdminVehicleFormModal
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initialVehicle={editingVehicle ?? undefined}
        fixedCustomerId={customerId}
        onClose={closeForm}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <Modal
        open={Boolean(deleteVehicleId && deletingVehicle)}
        onClose={() => setDeleteVehicleId(null)}
        title="Xóa phương tiện?"
        description={deletingVehicle?.raw_license_plate}
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-800">
            Thao tác này không thể hoàn tác. Hãy ngưng hoạt động nếu xe đang liên kết với lịch sử
            hoặc booking.
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

interface VehicleGroupProps {
  title: string
  vehicles: Vehicle[]
  onEdit: (vehicle: Vehicle) => void
}

function VehicleGroup({ title, vehicles, onEdit }: VehicleGroupProps) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <Badge>{vehicles.length}</Badge>
      </div>
      {vehicles.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          Chưa có phương tiện thuộc loại này.
        </p>
      ) : (
        <ul className="space-y-3">
          {vehicles.map((vehicle) => (
            <li
              key={vehicle.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {vehicle.normalized_license_plate ?? vehicle.raw_license_plate}
                </p>
                <p className="text-xs text-slate-500">
                  {vehicle.brand ?? ''} {vehicle.model ?? ''}{' '}
                  {vehicle.color ? `• ${vehicle.color}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {vehicle.is_default ? <Badge variant="info">Mặc định</Badge> : null}
                <Button variant="ghost" size="sm" onClick={() => onEdit(vehicle)}>
                  <Pencil className="h-4 w-4" /> Sửa
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
