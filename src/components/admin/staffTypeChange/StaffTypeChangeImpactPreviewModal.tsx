import { Loader2, ShieldCheck } from 'lucide-react'
import { getApiErrorMessage } from '../../../api/client'
import type { ApiStaffTypeChangeImpact } from '../../../api/staffTypeChange.api'
import { Button } from '../../ui/Button'
import { Modal } from '../../ui/Modal'

interface StaffTypeChangeImpactPreviewModalProps {
  open: boolean
  onClose: () => void
  impact: ApiStaffTypeChangeImpact | null
  isLoading?: boolean
  error?: unknown
}

export function StaffTypeChangeImpactPreviewModal({
  open,
  onClose,
  impact,
  isLoading = false,
  error = null,
}: StaffTypeChangeImpactPreviewModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ảnh hưởng khi đổi chức năng"
      description="BE tổng hợp các booking/step/assignment đang phụ trách để admin đánh giá trước khi duyệt."
    >
      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tính toán ảnh hưởng...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {getApiErrorMessage(error, 'Không tính được ảnh hưởng.')}
        </div>
      ) : !impact ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Chưa có dữ liệu ảnh hưởng.
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
            <span>
              Vai trò hiện tại:{' '}
              <strong>{impact.from_staff_type ?? '—'}</strong> · Vai trò đề
              xuất: <strong>—</strong>
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase text-slate-500">
                Booking đang mở
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {impact.affected_open_bookings ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase text-slate-500">
                Step đang chạy
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {impact.affected_active_steps ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase text-slate-500">
                Assignment chờ
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {impact.pending_assignments ?? 0}
              </p>
            </div>
          </div>
          {impact.affected_items && impact.affected_items.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Danh sách ảnh hưởng
              </p>
              <ul className="mt-2 space-y-2">
                {impact.affected_items.map((item, idx) => (
                  <li
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-700"
                  >
                    <pre className="whitespace-pre-wrap break-words font-sans">
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Modal>
  )
}
