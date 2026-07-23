import { ShieldCheck } from 'lucide-react'
import { getApiErrorMessage } from '../../../api/client'
import type { ApiStaffTypeChangeImpact } from '../../../api/staffTypeChange.api'
import { ImpactPreviewBlock } from './ImpactPreviewBlock'
import { Button } from '../../ui/Button'
import { Modal } from '../../ui/Modal'

interface StaffTypeChangeImpactPreviewModalProps {
  open: boolean
  onClose: () => void
  impact: ApiStaffTypeChangeImpact | null
  isLoading?: boolean
  error?: unknown
  /** Nhãn "vai trò hiện tại" để hiển thị. */
  fromStaffType?: string
  toStaffType?: string
}

/**
 * Đồng bộ với schema BE trả về (`buildStaffTypeChangeImpact`).
 */
export function StaffTypeChangeImpactPreviewModal({
  open,
  onClose,
  impact,
  isLoading = false,
  error = null,
  fromStaffType,
  toStaffType,
}: StaffTypeChangeImpactPreviewModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ảnh hưởng khi đổi chức năng"
      description="BE tổng hợp assignment, capacity, blocker và warning dựa trên trạng thái hiện tại của nhân viên."
    >
      {error ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {getApiErrorMessage(error, 'Không tính được ảnh hưởng.')}
        </div>
      ) : null}

      <div className="mb-3 flex items-center gap-2 text-sm text-slate-700">
        <ShieldCheck className="h-4 w-4 text-brand-600" />
        <span>
          Snapshot được tính tại thời điểm gọi impact và sẽ được BE lưu lại khi
          admin duyệt.
        </span>
      </div>

      <ImpactPreviewBlock
        impact={impact}
        isLoading={isLoading}
        error={error}
        fromStaffType={fromStaffType}
        toStaffType={toStaffType}
      />

      <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Modal>
  )
}
