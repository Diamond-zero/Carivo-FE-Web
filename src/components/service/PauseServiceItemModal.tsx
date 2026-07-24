import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Label } from '../ui/Label'
import { Button } from '../ui/Button'

interface PauseServiceItemModalProps {
  open: boolean
  itemName: string
  isSubmitting?: boolean
  onClose: () => void
  onConfirm: (reason: string) => void | Promise<void>
}

/**
 * Modal yêu cầu staff nhập lý do pause một service item.
 *
 * BE `pauseServiceItemSchema.body` yêu cầu `reason` 2-500 ký tự — staff
 * không có lý do hợp lệ sẽ bị BE từ chối. Lý do phổ biến: hết nước, khách
 * đi vắng, sự cố máy móc, chờ nhân sự hỗ trợ.
 */
export function PauseServiceItemModal({
  open,
  itemName,
  isSubmitting = false,
  onClose,
  onConfirm,
}: PauseServiceItemModalProps) {
  const [reason, setReason] = useState('')

  const trimmed = reason.trim()
  const canSubmit = trimmed.length >= 2 && trimmed.length <= 500 && !isSubmitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    await onConfirm(trimmed)
    setReason('')
  }

  const handleClose = () => {
    if (isSubmitting) return
    setReason('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Tạm dừng: ${itemName}`}
      description="Nhập lý do tạm dừng để hệ thống ghi log và khách hàng được thông báo (nếu có)."
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="pause-reason" required>
            Lý do tạm dừng
          </Label>
          <textarea
            id="pause-reason"
            className="min-h-[96px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
            placeholder="Vd: khách tạm rời garage, chờ kiểm tra thêm, sự cố thiết bị…"
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-slate-500">
            {trimmed.length}/500 ký tự · tối thiểu 2 ký tự
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? 'Đang tạm dừng…' : 'Tạm dừng'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
