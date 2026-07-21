import { ShieldCheck } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import type { StaffCapabilityKey } from '../../types/api/staffCapabilities'

interface StaffCapabilitiesCardProps {
  capabilities: StaffCapabilityKey[]
  isLoading?: boolean
  errorMessage?: string | null
}

const CAPABILITY_GROUPS: Array<{
  label: string
  keys: Array<{ key: StaffCapabilityKey; label: string }>
}> = [
  {
    label: 'Quản lý booking',
    keys: [
      { key: 'booking.create', label: 'Tạo booking (walk-in)' },
      { key: 'booking.cancel', label: 'Hủy booking' },
      { key: 'booking.check_in', label: 'Check-in khách' },
      { key: 'booking.mark_no_show', label: 'Đánh dấu không đến' },
      { key: 'booking.assign_wash_bay', label: 'Phân buồng rửa' },
      { key: 'booking.mark_paid_cash', label: 'Xác nhận tiền mặt' },
      { key: 'booking.initiate_payos', label: 'Tạo link PayOS' },
    ],
  },
  {
    label: 'Sự cố & bồi thường',
    keys: [
      { key: 'booking.report_incident', label: 'Báo cáo sự cố' },
      { key: 'booking.resolve_incident', label: 'Xử lý sự cố' },
      { key: 'booking.issue_compensation_voucher', label: 'Phát voucher bồi thường' },
    ],
  },
  {
    label: 'Tiến trình dịch vụ',
    keys: [
      { key: 'service_workflow.complete_early', label: 'Hoàn thành sớm' },
      { key: 'service_workflow.confirm_complete', label: 'Xác nhận hoàn thành' },
      { key: 'service_workflow.pause', label: 'Tạm dừng' },
      { key: 'service_workflow.resume', label: 'Tiếp tục' },
    ],
  },
  {
    label: 'Kiểm tra xe',
    keys: [
      { key: 'inspection.create_before_wash', label: 'Kiểm tra trước rửa' },
      { key: 'inspection.create_after_wash', label: 'Kiểm tra sau rửa' },
    ],
  },
  {
    label: 'Hồ sơ khiếu nại',
    keys: [
      { key: 'customer_case.create', label: 'Tạo hồ sơ' },
      { key: 'customer_case.update', label: 'Cập nhật hồ sơ' },
      { key: 'customer_case.resolve', label: 'Giải quyết hồ sơ' },
    ],
  },
  {
    label: 'Đổi vị trí',
    keys: [
      { key: 'staff_type_change.request', label: 'Yêu cầu đổi vị trí' },
      { key: 'staff_type_change.cancel', label: 'Hủy yêu cầu đổi' },
    ],
  },
]

export function StaffCapabilitiesCard({
  capabilities,
  isLoading,
  errorMessage,
}: StaffCapabilitiesCardProps) {
  const grantedKeys = new Set(capabilities)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5 text-slate-500" />
          Quyền hạn của bạn
        </CardTitle>
      </CardHeader>
      <CardContent>
        {errorMessage ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {errorMessage}
          </div>
        ) : isLoading ? (
          <div className="text-sm text-slate-500">Đang tải quyền…</div>
        ) : capabilities.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Quản trị viên chưa cấp quyền cho tài khoản này. Liên hệ admin để được phân quyền.
          </div>
        ) : (
          <div className="space-y-4">
            {CAPABILITY_GROUPS.map((group) => {
              const grantedInGroup = group.keys.filter((entry) =>
                grantedKeys.has(entry.key),
              )
              if (grantedInGroup.length === 0) return null
              return (
                <div key={group.label}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {grantedInGroup.map((entry) => (
                      <Badge key={entry.key} variant="info">
                        {entry.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
            <p className="text-xs text-slate-500">
              Tổng cộng {capabilities.length} quyền đang được cấp.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}