import { Gift, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../../api/client'
import type { AdminGiftVoucherPayload } from '../../../api/customerVoucher.api'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminCustomerVoucherMutations } from '../../../hooks/api/admin/useAdminCustomerVouchers'
import { useAdminGarages } from '../../../hooks/api/admin/useAdminGarages'
import { useAdminServicePackages } from '../../../hooks/api/admin/useAdminServicePackages'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import { Select } from '../../ui/Select'
import { Textarea } from '../../ui/Textarea'

type VoucherType = 'FIXED_AMOUNT' | 'PERCENTAGE' | 'FREE_SERVICE'

interface AdminGiftVoucherModalProps {
  open: boolean
  customerId: string
  customerName: string
  onClose: () => void
  onIssued?: () => void
}

function getDefaultExpiryDate() {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function AdminGiftVoucherModal({
  open,
  customerId,
  customerName,
  onClose,
  onIssued,
}: AdminGiftVoucherModalProps) {
  const { showToast } = useToast()
  const { allGarages } = useAdminGarages()
  const { allPackages } = useAdminServicePackages()
  const { createGiftMutation } = useAdminCustomerVoucherMutations()
  const [voucherType, setVoucherType] = useState<VoucherType>('FIXED_AMOUNT')
  const [garageId, setGarageId] = useState('')
  const [value, setValue] = useState('50000')
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('')
  const [minOrderAmount, setMinOrderAmount] = useState('0')
  const [servicePackageId, setServicePackageId] = useState('')
  const [expiresDate, setExpiresDate] = useState(getDefaultExpiryDate)
  const [note, setNote] = useState('')

  const activeGarages = useMemo(
    () => allGarages.filter((garage) => garage.is_active),
    [allGarages],
  )
  const activePrimaryPackages = useMemo(
    () =>
      allPackages.filter(
        (servicePackage) =>
          servicePackage.is_active && servicePackage.service_type !== 'ADDON',
      ),
    [allPackages],
  )

  useEffect(() => {
    if (!open) return
    setVoucherType('FIXED_AMOUNT')
    setGarageId('')
    setValue('50000')
    setMaxDiscountAmount('')
    setMinOrderAmount('0')
    setServicePackageId('')
    setExpiresDate(getDefaultExpiryDate())
    setNote('')
  }, [open])

  useEffect(() => {
    if (open && !garageId && activeGarages[0]) {
      setGarageId(activeGarages[0].id)
    }
  }, [open, garageId, activeGarages])

  const closeModal = () => {
    if (!createGiftMutation.isPending) {
      onClose()
    }
  }

  const handleSubmit = async () => {
    const numericValue = voucherType === 'FREE_SERVICE' ? 0 : Number(value)
    const numericMinOrder = Number(minOrderAmount || 0)
    const numericMaxDiscount = Number(maxDiscountAmount)
    const trimmedNote = note.trim()
    const expiresAt = new Date(`${expiresDate}T23:59:59`)

    if (!garageId) {
      showToast('Vui lòng chọn chi nhánh phát hành.', 'error')
      return
    }
    if (!expiresDate || Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      showToast('Hạn sử dụng phải nằm trong tương lai.', 'error')
      return
    }
    if (trimmedNote.length < 5) {
      showToast('Lý do tặng voucher phải có ít nhất 5 ký tự.', 'error')
      return
    }
    if (!Number.isFinite(numericMinOrder) || numericMinOrder < 0) {
      showToast('Giá trị đơn tối thiểu không hợp lệ.', 'error')
      return
    }
    if (
      voucherType === 'FIXED_AMOUNT' &&
      (!Number.isFinite(numericValue) || numericValue <= 0)
    ) {
      showToast('Số tiền giảm phải lớn hơn 0.', 'error')
      return
    }
    if (
      voucherType === 'PERCENTAGE' &&
      (!Number.isFinite(numericValue) || numericValue <= 0 || numericValue > 100)
    ) {
      showToast('Phần trăm giảm phải nằm trong khoảng 1–100.', 'error')
      return
    }
    if (
      voucherType === 'PERCENTAGE' &&
      (!Number.isFinite(numericMaxDiscount) || numericMaxDiscount <= 0)
    ) {
      showToast('Vui lòng nhập số tiền giảm tối đa.', 'error')
      return
    }
    if (voucherType === 'FREE_SERVICE' && !servicePackageId) {
      showToast('Vui lòng chọn gói dịch vụ được tặng.', 'error')
      return
    }

    const payload: AdminGiftVoucherPayload = {
      customer_id: customerId,
      garage_id: garageId,
      voucher_type: voucherType,
      value: numericValue,
      min_order_amount: numericMinOrder,
      max_discount_amount:
        voucherType === 'PERCENTAGE' ? numericMaxDiscount : null,
      service_package_id:
        voucherType === 'FREE_SERVICE' ? servicePackageId : null,
      expires_at: expiresAt.toISOString(),
      note: trimmedNote,
    }

    try {
      const voucher = await createGiftMutation.mutateAsync(payload)
      showToast(`Đã tặng voucher ${voucher.code} cho ${customerName}.`, 'success')
      onIssued?.()
      onClose()
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể tặng voucher cho customer.'),
        'error',
      )
    }
  }

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Tặng voucher riêng"
      description={`Voucher chỉ thuộc về ${customerName} và không thể dùng bởi customer khác.`}
      className="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="gift-voucher-garage" required>
              Chi nhánh phát hành
            </Label>
            <Select
              id="gift-voucher-garage"
              value={garageId}
              onChange={(event) => setGarageId(event.target.value)}
            >
              <option value="">Chọn chi nhánh</option>
              {activeGarages.map((garage) => (
                <option key={garage.id} value={garage.id}>
                  {garage.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="gift-voucher-type" required>
              Loại voucher
            </Label>
            <Select
              id="gift-voucher-type"
              value={voucherType}
              onChange={(event) => setVoucherType(event.target.value as VoucherType)}
            >
              <option value="FIXED_AMOUNT">Giảm số tiền cố định</option>
              <option value="PERCENTAGE">Giảm theo phần trăm</option>
              <option value="FREE_SERVICE">Tặng gói dịch vụ</option>
            </Select>
          </div>
        </div>

        {voucherType !== 'FREE_SERVICE' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="gift-voucher-value" required>
                {voucherType === 'PERCENTAGE' ? 'Phần trăm giảm' : 'Số tiền giảm'}
              </Label>
              <Input
                id="gift-voucher-value"
                type="number"
                min="1"
                max={voucherType === 'PERCENTAGE' ? '100' : undefined}
                step={voucherType === 'PERCENTAGE' ? '1' : '1000'}
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
            </div>
            {voucherType === 'PERCENTAGE' ? (
              <div>
                <Label htmlFor="gift-voucher-max" required>
                  Giảm tối đa (VND)
                </Label>
                <Input
                  id="gift-voucher-max"
                  type="number"
                  min="1000"
                  step="1000"
                  value={maxDiscountAmount}
                  onChange={(event) => setMaxDiscountAmount(event.target.value)}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div>
            <Label htmlFor="gift-voucher-package" required>
              Gói dịch vụ được tặng
            </Label>
            <Select
              id="gift-voucher-package"
              value={servicePackageId}
              onChange={(event) => setServicePackageId(event.target.value)}
            >
              <option value="">Chọn gói dịch vụ</option>
              {activePrimaryPackages.map((servicePackage) => (
                <option key={servicePackage.id} value={servicePackage.id}>
                  {servicePackage.name} · {servicePackage.vehicle_type}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="gift-voucher-min-order">Đơn tối thiểu (VND)</Label>
            <Input
              id="gift-voucher-min-order"
              type="number"
              min="0"
              step="1000"
              value={minOrderAmount}
              onChange={(event) => setMinOrderAmount(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="gift-voucher-expiry" required>
              Hạn sử dụng
            </Label>
            <Input
              id="gift-voucher-expiry"
              type="date"
              value={expiresDate}
              onChange={(event) => setExpiresDate(event.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="gift-voucher-note" required>
            Lý do tặng
          </Label>
          <Textarea
            id="gift-voucher-note"
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="VD: Tri ân customer có nhiều lượt sử dụng dịch vụ"
          />
          <p className="mt-1 text-xs text-slate-500">
            Lý do được lưu vào voucher và audit log.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={closeModal}
            disabled={createGiftMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={createGiftMutation.isPending}
          >
            {createGiftMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Gift className="h-4 w-4" />
            )}
            {createGiftMutation.isPending ? 'Đang phát hành…' : 'Tặng voucher'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
