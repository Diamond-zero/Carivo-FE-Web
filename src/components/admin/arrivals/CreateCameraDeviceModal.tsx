import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, Loader2, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminGarageOptions } from '../../../hooks/api/admin/useAdminGarages'
import {
  createCameraDeviceSchema,
  type CreateCameraDeviceValues,
} from '../../../lib/validations/adminCameraDevice'
import type { ApiCameraDeviceWithKey } from '../../../types/api/plateScan'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import { Select } from '../../ui/Select'

interface CreateCameraDeviceModalProps {
  open: boolean
  onClose: () => void
  onCreated: (created: ApiCameraDeviceWithKey) => void
  createDevice: (payload: {
    device_code: string
    name: string
    garage_id: string
    location?: string
  }) => Promise<ApiCameraDeviceWithKey>
}

export function CreateCameraDeviceModal({
  open,
  onClose,
  onCreated,
  createDevice,
}: CreateCameraDeviceModalProps) {
  const { showToast } = useToast()
  const garages = useAdminGarageOptions()
  const [created, setCreated] = useState<ApiCameraDeviceWithKey | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCameraDeviceValues>({
    resolver: zodResolver(createCameraDeviceSchema),
    defaultValues: {
      device_code: '',
      name: '',
      garage_id: '',
      location: '',
    },
  })

  useEffect(() => {
    if (!open) {
      reset()
      setCreated(null)
      setCopied(false)
    }
  }, [open, reset])

  const handleSubmitForm = async (values: CreateCameraDeviceValues) => {
    const trimmedLocation = (values.location ?? '').trim()
    try {
      const result = await createDevice({
        device_code: values.device_code.toUpperCase(),
        name: values.name.trim(),
        garage_id: values.garage_id,
        location: trimmedLocation ? trimmedLocation : undefined,
      })
      setCreated(result)
      onCreated(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo camera.'
      showToast(message, 'error')
    }
  }

  const handleCopy = async () => {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.api_key)
      setCopied(true)
      showToast('Đã sao chép API key vào bộ nhớ tạm.', 'success')
    } catch {
      showToast('Không thể sao chép. Hãy copy thủ công.', 'error')
    }
  }

  const handleDone = () => {
    if (created) {
      showToast(`Đã đăng ký camera ${created.device.name}.`, 'success')
    }
    onClose()
  }

  if (created) {
    return (
      <Modal
        open={open}
        onClose={handleDone}
        title="Đăng ký camera thành công"
        description="Sao chép API key ngay — hệ thống sẽ không hiển thị lại."
        className="max-w-xl"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">API key chỉ hiển thị một lần duy nhất</p>
              <p className="mt-1 text-xs text-amber-800/90">
                Sau khi đóng hộp thoại, bạn không thể xem lại. Nếu mất key, hãy
                dùng chức năng "Rotate key" trong danh sách camera.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              API key
            </p>
            <p className="mt-2 break-all rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900">
              {created.api_key}
            </p>
            <div className="mt-3 flex justify-end">
              <Button size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
                {copied ? 'Đã sao chép' : 'Sao chép'}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Camera vừa tạo
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-slate-500">Mã</dt>
              <dd className="font-medium text-slate-900">{created.device.device_code}</dd>
              <dt className="text-slate-500">Tên</dt>
              <dd className="font-medium text-slate-900">{created.device.name}</dd>
              <dt className="text-slate-500">Trạng thái</dt>
              <dd className="font-medium text-slate-900">{created.device.status}</dd>
            </dl>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleDone}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Đăng ký camera cổng mới"
      description="API key sẽ được tạo tự động — sao chép ngay sau khi submit."
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="device_code">Mã camera</Label>
            <Input
              id="device_code"
              placeholder="CAM-Q7-01"
              error={errors.device_code?.message}
              {...register('device_code')}
            />
            <p className="mt-1 text-xs text-slate-500">
              Tự động viết hoa khi gửi lên server.
            </p>
          </div>
          <div>
            <Label htmlFor="name">Tên hiển thị</Label>
            <Input
              id="name"
              placeholder="Camera cổng chính"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          <div>
            <Label htmlFor="garage_id">Garage</Label>
            <Select
              id="garage_id"
              error={errors.garage_id?.message}
              {...register('garage_id')}
              defaultValue=""
            >
              <option value="">Chọn garage…</option>
              {garages.map((garage) => (
                <option key={garage.id} value={garage.id}>
                  {garage.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="location">Vị trí</Label>
            <Input
              id="location"
              placeholder="Cổng trước / cổng sau…"
              error={errors.location?.message}
              {...register('location')}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Đăng ký
          </Button>
        </div>
      </form>
    </Modal>
  )
}
