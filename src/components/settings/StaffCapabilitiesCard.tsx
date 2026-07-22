import { ShieldCheck } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import type { StaffCapabilityKey } from '../../types/api/staffCapabilities'
import { CAPABILITY_LABELS } from '../../constants/staffCapabilities'

interface StaffCapabilitiesCardProps {
  capabilities: StaffCapabilityKey[]
  isLoading?: boolean
  errorMessage?: string | null
}

const CAPABILITY_GROUPS: Array<{
  label: string
  keys: StaffCapabilityKey[]
}> = [
  {
    label: 'Quản lý booking',
    keys: [
      'booking.walk_in.create',
      'booking.cancel_customer_request',
      'booking.check_in',
      'booking.arrival.manage',
      'booking.wash_bay.assign',
      'booking.payment.collect_cash',
    ],
  },
  {
    label: 'Sự cố & bồi thường',
    keys: [
      'incident.read_garage',
      'incident.read_assigned',
      'incident.report_wash_bay_failure',
      'incident.report_staff_unavailable',
      'incident.report_other_garage',
      'incident.record_customer_decision',
      'incident.compensation.issue',
    ],
  },
  {
    label: 'Tiến trình dịch vụ',
    keys: [
      'booking.service.start',
      'booking.service.complete',
      'booking.service.read_garage',
      'service_task.read_assigned',
      'service_task.wash.execute_assigned',
      'service_task.care.execute_assigned',
    ],
  },
  {
    label: 'Kiểm tra xe',
    keys: [
      'inspection.read_garage',
      'inspection.read_assigned',
      'inspection.create_assigned',
    ],
  },
  {
    label: 'Hồ sơ khiếu nại',
    keys: [
      'customer_case.read_garage',
      'customer_case.assign_garage',
      'customer_case.acknowledge',
      'customer_case.communicate_assigned',
      'customer_case.create_walk_in',
      'customer_case.technical_assess_assigned',
      'customer_case.sla.read_garage',
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
              const grantedInGroup = group.keys.filter((key) =>
                grantedKeys.has(key),
              )
              if (grantedInGroup.length === 0) return null
              return (
                <div key={group.label}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {grantedInGroup.map((key) => (
                      <Badge key={key} variant="info">
                        {CAPABILITY_LABELS[key]}
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
