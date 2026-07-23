import { Copy, Loader2, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useToast } from '../../../contexts/ToastContext'
import type { ApiCameraDevice, ApiCameraDeviceWithKey } from '../../../types/api/plateScan'
import { Button } from '../../ui/Button'
import { Modal } from '../../ui/Modal'

interface RotateApiKeyModalProps {
  open: boolean
  device: ApiCameraDevice | null
  isRotating: boolean
  onClose: () => void
  onRotated: (data: ApiCameraDeviceWithKey) => void
  rotateKey: () => Promise<ApiCameraDeviceWithKey>
}

export function RotateApiKeyModal({
  open,
  device,
  isRotating,
  onClose,
  onRotated,
  rotateKey,
}: RotateApiKeyModalProps) {
  const { showToast } = useToast()
  const [confirming, setConfirming] = useState(false)
  const [rotated, setRotated] = useState<ApiCameraDeviceWithKey | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) {
      setConfirming(false)
      setRotated(null)
      setCopied(false)
    }
  }, [open])

  const handleRotate = async () => {
    if (!device) return
    try {
      const result = await rotateKey()
      setRotated(result)
      onRotated(result)
      showToast(`Đã rotate key cho ${device.name}.`, 'success')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể rotate API key.'
      showToast(message, 'error')
    }
  }

  const handleCopy = async () => {
    if (!rotated) return
    try {
      await navigator.clipboard.writeText(rotated.api_key)
      setCopied(true)
      showToast('Đã sao chép API key mới.', 'success')
    } catch {
      showToast('Không thể sao chép. Hãy copy thủ công.', 'error')
    }
  }

  if (!device) return null

  if (rotated) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="API key mới đã sẵn sàng"
        description={`Key của "${device.name}" vừa được rotate. Sao chép ngay.`}
        className="max-w-xl"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">API key cũ sẽ hết hiệu lực ngay lập tức</p>
              <p className="mt-1 text-xs text-amber-800/90">
                Camera thiết bị cần được cập nhật key mới trước khi hết hạn key
                heartbeat, nếu không sẽ rơi vào trạng thái OFFLINE.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              API key mới
            </p>
            <p className="mt-2 break-all rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900">
              {rotated.api_key}
            </p>
            <div className="mt-3 flex justify-end">
              <Button size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
                {copied ? 'Đã sao chép' : 'Sao chép'}
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={onClose}>
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
      title="Rotate API key?"
      description={confirming ? undefined : `Camera "${device.name}" (${device.device_code}).`}
      className="max-w-xl"
    >
      {!confirming ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Rotate key sẽ tạo một API key mới và vô hiệu hóa key hiện tại. Camera
            cổng phải cập nhật key mới để tiếp tục hoạt động.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={() => setConfirming(true)}>
              <ShieldAlert className="h-4 w-4" />
              Tôi hiểu — tiếp tục
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-800">
            Thao tác này không thể hoàn tác. Camera sẽ rơi vào OFFLINE cho đến khi
            được cập nhật key mới.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Quay lại
            </Button>
            <Button variant="danger" onClick={handleRotate} disabled={isRotating}>
              {isRotating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldAlert className="h-4 w-4" />
              )}
              Xác nhận rotate
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
