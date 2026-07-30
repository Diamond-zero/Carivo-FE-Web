import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../ui/Button'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import { Select } from '../../ui/Select'
import { useToast } from '../../../contexts/ToastContext'
import {
  COMPENSATION_VOUCHER_TYPE_LABELS,
  issueCompensationVoucherApi,
} from '../../../api/incident.api'
import type { ApiCompensationVoucherType } from '../../../types/api/staff'

interface ServicePackageOption {
  id: string
  name: string
  base_price: number
}

interface CompensationVoucherModalProps {
  open: boolean
  bookingId: string
  incidentId: string
  /** Danh sách gói dịch vụ để chọn khi VoucherType = FREE_SERVICE. */
  servicePackages: ServicePackageOption[]
  onClose: () => void
  onIssued: (voucherId: string, requiresApproval: boolean) => void
  /** Giá trị mặc định ban đầu (từ cấu hình). BE mặc định tối đa 100000 VND/staff. */
  staffLimitHint?: number
  recipientHint?: string
}

export function CompensationVoucherModal({
  open,
  bookingId,
  incidentId,
  servicePackages,
  onClose,
  onIssued,
  staffLimitHint,
  recipientHint,
}: CompensationVoucherModalProps) {
  const { showToast } = useToast()
  const [voucherType, setVoucherType] =
    useState<ApiCompensationVoucherType>('FIXED_AMOUNT')
  const [value, setValue] = useState('')
  const [maxDiscount, setMaxDiscount] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [servicePackageId, setServicePackageId] = useState('')
  const [expiresAtLocal, setExpiresAtLocal] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const requiresServicePackage = voucherType === 'FREE_SERVICE'
  const requiresMaxDiscount = voucherType === 'PERCENTAGE'

  useEffect(() => {
    if (!open) {
      setVoucherType('FIXED_AMOUNT')
      setValue('')
      setMaxDiscount('')
      setMinOrder('')
      setServicePackageId('')
      setExpiresAtLocal('')
      setNote('')
    }
  }, [open])

  const valueNumber = Number(value)
  const overLimit =
    staffLimitHint !== undefined &&
    voucherType === 'FIXED_AMOUNT' &&
    valueNumber > staffLimitHint

  const parsedExpiresAt = useMemo(() => {
    if (!expiresAtLocal) return null
    const date = new Date(expiresAtLocal)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString()
  }, [expiresAtLocal])

  const handleSubmit = async () => {
    if (!value || Number.isNaN(valueNumber)) {
      showToast('Vui lòng nhập giá trị voucher.', 'error')
      return
    }
    if (!parsedExpiresAt) {
      showToast('Vui lòng chọn ngày hết hạn.', 'error')
      return
    }
    if (requiresServicePackage && !servicePackageId) {
      showToast('Vui lòng chọn gói dịch vụ cho voucher miễn phí.', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        voucher_type: voucherType,
        value:
          voucherType === 'FREE_SERVICE'
            ? 0
            : voucherType === 'PERCENTAGE'
              ? valueNumber
              : valueNumber,
        max_discount_amount: requiresMaxDiscount
          ? Number(maxDiscount) || undefined
          : undefined,
        min_order_amount: minOrder ? Number(minOrder) : undefined,
        service_package_id: requiresServicePackage
          ? servicePackageId
          : undefined,
        expires_at: parsedExpiresAt,
        note: note.trim() || undefined,
      }

      const result = await issueCompensationVoucherApi(
        bookingId,
        incidentId,
        payload,
      )

      showToast(
        result.requires_approval
          ? `Đã tạo voucher. Vượt hạn mức — chờ admin duyệt.`
          : 'Đã phát hành voucher bồi thường.',
        'success',
      )
      onIssued(result.voucher.id, result.requires_approval)
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'Không thể phát hành voucher.',
        'error',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Phát hành voucher bồi thường"
      description={
        recipientHint ??
        'Voucher chỉ dùng cho khách hàng của booking này và khả dụng sau khi admin duyệt (nếu vượt hạn mức).'
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="voucher-type" required>
            Loại voucher
          </Label>
          <Select
            id="voucher-type"
            value={voucherType}
            onChange={(event) =>
              setVoucherType(
                event.target.value as ApiCompensationVoucherType,
              )
            }
          >
            {(
              Object.keys(
                COMPENSATION_VOUCHER_TYPE_LABELS,
              ) as ApiCompensationVoucherType[]
            ).map((type) => (
              <option key={type} value={type}>
                {COMPENSATION_VOUCHER_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label
            htmlFor="voucher-value"
            required
            className={
              voucherType === 'PERCENTAGE' ? '' : 'after:ml-0.5 after:text-red-500'
            }
          >
            {voucherType === 'PERCENTAGE'
              ? 'Phần trăm giảm (%)'
              : voucherType === 'FREE_SERVICE'
                ? 'Giá trị (để 0)'
                : 'Giá trị (VND)'}
          </Label>
          <input
            id="voucher-value"
            type="number"
            min={0}
            className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          {overLimit ? (
            <p className="mt-1.5 text-sm text-amber-700">
              Vượt hạn mức {staffLimitHint!.toLocaleString('vi-VN')} VND/staff —
              voucher sẽ cần admin duyệt.
            </p>
          ) : null}
        </div>

        {requiresMaxDiscount ? (
          <div>
            <Label htmlFor="voucher-max">Giảm tối đa (VND)</Label>
            <input
              id="voucher-max"
              type="number"
              min={0}
              className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
              value={maxDiscount}
              onChange={(event) => setMaxDiscount(event.target.value)}
            />
          </div>
        ) : null}

        <div>
          <Label htmlFor="voucher-min-order">Đơn tối thiểu (VND)</Label>
          <input
            id="voucher-min-order"
            type="number"
            min={0}
            className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
            value={minOrder}
            onChange={(event) => setMinOrder(event.target.value)}
          />
        </div>

        {requiresServicePackage ? (
          <div>
            <Label htmlFor="voucher-package" required>
              Gói dịch vụ áp dụng
            </Label>
            <Select
              id="voucher-package"
              value={servicePackageId}
              onChange={(event) => setServicePackageId(event.target.value)}
            >
              <option value="">— Chọn gói —</option>
              {servicePackages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div>
          <Label htmlFor="voucher-expires" required>
            Ngày hết hạn
          </Label>
          <input
            id="voucher-expires"
            type="datetime-local"
            className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
            value={expiresAtLocal}
            onChange={(event) => setExpiresAtLocal(event.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="voucher-note">Lý do bồi thường</Label>
          <textarea
            id="voucher-note"
            className="min-h-[80px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
            placeholder="Mô tả lý do tặng voucher cho khách…"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Đang phát hành…' : 'Phát hành voucher'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
