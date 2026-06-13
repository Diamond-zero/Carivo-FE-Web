import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { VEHICLE_TYPE_LABELS, WASH_BAY_STATUS_LABELS } from '../../../constants/washBayStatus'
import {
  adminWashBayCreateSchema,
  adminWashBayFormSchema,
  type AdminWashBayCreateValues,
  type AdminWashBayFormValues,
} from '../../../lib/validations/adminWashBay'
import { getAdminGaragesFromStore } from '../../../mocks/admin/adminGarageStore'
import type { WashBay } from '../../../types/washBay'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import { Select } from '../../ui/Select'

interface AdminWashBayFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  initialBay?: WashBay
  onClose: () => void
  onSubmit: (values: AdminWashBayFormValues | AdminWashBayCreateValues) => Promise<void>
  isSubmitting?: boolean
}

export function AdminWashBayFormModal({
  open,
  mode,
  initialBay,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AdminWashBayFormModalProps) {
  const garages = getAdminGaragesFromStore().filter((garage) => garage.is_active)
  const isOccupied = initialBay?.status === 'OCCUPIED'

  const createForm = useForm<AdminWashBayCreateValues>({
    resolver: zodResolver(adminWashBayCreateSchema),
    defaultValues: {
      garage_id: garages[0]?.id ?? '',
      name: '',
      bay_code: '',
      vehicle_type: 'CAR',
      is_active: true,
    },
  })

  const editForm = useForm<AdminWashBayFormValues>({
    resolver: zodResolver(adminWashBayFormSchema),
    defaultValues: {
      garage_id: '',
      name: '',
      bay_code: '',
      vehicle_type: 'CAR',
      status: 'AVAILABLE',
      is_active: true,
    },
  })

  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      createForm.reset({
        garage_id: garages[0]?.id ?? '',
        name: '',
        bay_code: '',
        vehicle_type: 'CAR',
        is_active: true,
      })
      return
    }

    if (initialBay) {
      editForm.reset({
        garage_id: initialBay.garage_id,
        name: initialBay.name,
        bay_code: initialBay.bay_code,
        vehicle_type: initialBay.vehicle_type,
        status:
          initialBay.status === 'MAINTENANCE'
            ? 'MAINTENANCE'
            : initialBay.status === 'INACTIVE'
              ? 'INACTIVE'
              : 'AVAILABLE',
        is_active: initialBay.is_active,
      })
    }
  }, [open, mode, initialBay, createForm, editForm, garages])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Thêm buồng rửa' : 'Sửa buồng rửa'}
      description={
        mode === 'create'
          ? 'Cấu hình buồng rửa mới cho garage đã chọn.'
          : isOccupied
            ? 'Buồng đang có booking — chỉ sửa thông tin cơ bản.'
            : 'Cập nhật thông tin và trạng thái vận hành buồng rửa.'
      }
    >
      {mode === 'create' ? (
        <form
          onSubmit={createForm.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="create-garage_id">Garage</Label>
            <Select
              id="create-garage_id"
              error={createForm.formState.errors.garage_id?.message}
              {...createForm.register('garage_id')}
            >
              {garages.map((garage) => (
                <option key={garage.id} value={garage.id}>
                  {garage.name} ({garage.garage_code})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="create-name">Tên buồng rửa</Label>
            <Input
              id="create-name"
              placeholder="Buồng rửa ô tô A"
              error={createForm.formState.errors.name?.message}
              {...createForm.register('name')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="create-bay_code">Mã buồng</Label>
              <Input
                id="create-bay_code"
                placeholder="CAR-A1"
                error={createForm.formState.errors.bay_code?.message}
                {...createForm.register('bay_code')}
              />
            </div>
            <div>
              <Label htmlFor="create-vehicle_type">Loại xe</Label>
              <Select
                id="create-vehicle_type"
                error={createForm.formState.errors.vehicle_type?.message}
                {...createForm.register('vehicle_type')}
              >
                <option value="CAR">{VEHICLE_TYPE_LABELS.CAR}</option>
                <option value="MOTORBIKE">{VEHICLE_TYPE_LABELS.MOTORBIKE}</option>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
            <input
              id="create-is_active"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              {...createForm.register('is_active')}
            />
            <Label htmlFor="create-is_active" className="mb-0 cursor-pointer">
              Buồng rửa đang kích hoạt
            </Label>
          </div>

          <FormActions isSubmitting={isSubmitting} mode={mode} onClose={onClose} />
        </form>
      ) : (
        <form onSubmit={editForm.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="edit-garage_id">Garage</Label>
            <Select
              id="edit-garage_id"
              disabled={isOccupied}
              error={editForm.formState.errors.garage_id?.message}
              {...editForm.register('garage_id')}
            >
              {garages.map((garage) => (
                <option key={garage.id} value={garage.id}>
                  {garage.name} ({garage.garage_code})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-name">Tên buồng rửa</Label>
            <Input
              id="edit-name"
              error={editForm.formState.errors.name?.message}
              {...editForm.register('name')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-bay_code">Mã buồng</Label>
              <Input
                id="edit-bay_code"
                error={editForm.formState.errors.bay_code?.message}
                {...editForm.register('bay_code')}
              />
            </div>
            <div>
              <Label htmlFor="edit-vehicle_type">Loại xe</Label>
              <Select
                id="edit-vehicle_type"
                error={editForm.formState.errors.vehicle_type?.message}
                {...editForm.register('vehicle_type')}
              >
                <option value="CAR">{VEHICLE_TYPE_LABELS.CAR}</option>
                <option value="MOTORBIKE">{VEHICLE_TYPE_LABELS.MOTORBIKE}</option>
              </Select>
            </div>
          </div>

          {isOccupied ? (
            <div className="rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-brand-900">
              Trạng thái hiện tại:{' '}
              <strong>{WASH_BAY_STATUS_LABELS[initialBay!.status]}</strong>
              {initialBay?.current_booking_id
                ? ` — ${initialBay.current_booking_id.replace('booking-', 'BK-')}`
                : null}
            </div>
          ) : (
            <div>
              <Label htmlFor="edit-status">Trạng thái vận hành</Label>
              <Select
                id="edit-status"
                error={editForm.formState.errors.status?.message}
                {...editForm.register('status')}
              >
                <option value="AVAILABLE">{WASH_BAY_STATUS_LABELS.AVAILABLE}</option>
                <option value="MAINTENANCE">{WASH_BAY_STATUS_LABELS.MAINTENANCE}</option>
                <option value="INACTIVE">{WASH_BAY_STATUS_LABELS.INACTIVE}</option>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
            <input
              id="edit-is_active"
              type="checkbox"
              disabled={isOccupied}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              {...editForm.register('is_active')}
            />
            <Label htmlFor="edit-is_active" className="mb-0 cursor-pointer">
              Buồng rửa đang kích hoạt
            </Label>
          </div>

          <FormActions isSubmitting={isSubmitting} mode={mode} onClose={onClose} />
        </form>
      )}
    </Modal>
  )
}

function FormActions({
  isSubmitting,
  mode,
  onClose,
}: {
  isSubmitting: boolean
  mode: 'create' | 'edit'
  onClose: () => void
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
      <Button type="button" variant="secondary" onClick={onClose}>
        Hủy
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang lưu...
          </>
        ) : mode === 'create' ? (
          'Tạo buồng rửa'
        ) : (
          'Lưu thay đổi'
        )}
      </Button>
    </div>
  )
}
