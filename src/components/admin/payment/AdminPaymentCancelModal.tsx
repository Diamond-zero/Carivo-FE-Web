import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../ui/Button'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import { Textarea } from '../../ui/Textarea'
import {
  cancelAdminPaymentSchema,
  type CancelAdminPaymentFormValues,
} from '../../../lib/validations/adminPayment'

interface AdminPaymentCancelModalProps {
  open: boolean
  paymentId: string | null
  onClose: () => void
  onConfirm: (paymentId: string, reason: string) => void
  isPending?: boolean
}

export function AdminPaymentCancelModal({
  open,
  paymentId,
  onClose,
  onConfirm,
  isPending,
}: AdminPaymentCancelModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CancelAdminPaymentFormValues>({
    resolver: zodResolver(cancelAdminPaymentSchema),
    defaultValues: { reason: '' },
    mode: 'onChange',
  })

  useEffect(() => {
    if (!open) reset({ reason: '' })
  }, [open, reset])

  const onSubmit = (values: CancelAdminPaymentFormValues) => {
    if (!paymentId) return
    onConfirm(paymentId, values.reason)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Huỷ giao dịch thanh toán"
      description="Giao dịch sẽ được huỷ trên PayOS và booking quay về trạng thái CHƯA THANH TOÁN. Hành động này không thể hoàn tác."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="cancel-reason">Lý do huỷ *</Label>
          <Textarea
            id="cancel-reason"
            rows={3}
            placeholder="Vd. Khách yêu cầu đổi sang tiền mặt / PayOS timeout…"
            {...register('reason')}
          />
          {errors.reason ? (
            <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Đóng
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={!isValid || isPending || !paymentId}
          >
            {isPending ? 'Đang huỷ…' : 'Xác nhận huỷ'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
