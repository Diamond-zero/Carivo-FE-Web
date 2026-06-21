import { Clock, Hourglass, Loader2, Send } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../../api/client'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Label } from '../../../components/ui/Label'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { VEHICLE_TYPE_LABELS } from '../../../constants/washBayStatus'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminGarages } from '../../../hooks/api/admin/useAdminGarages'
import {
  useAdminWaitlistMutations,
  useAdminWaitlists,
  WAITLIST_STATUS_LABELS,
} from '../../../hooks/api/admin/useAdminWaitlists'
import type { ApiWaitlist } from '../../../types/api/admin'
import { formatDateTime } from '../../../utils/format'

export function AdminWaitlistsPage() {
  const { showToast } = useToast()
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [garageFilter, setGarageFilter] = useState<string>('ALL')
  const [confirmAction, setConfirmAction] = useState<{
    id: string
    type: 'offer' | 'cancel' | 'expire'
    label: string
  } | null>(null)

  const params = useMemo(
    () => ({
      status:
        statusFilter === 'ALL'
          ? undefined
          : (statusFilter as 'WAITING' | 'OFFERED' | 'ACCEPTED' | 'CANCELED' | 'EXPIRED'),
      garage_id: garageFilter === 'ALL' ? undefined : garageFilter,
    }),
    [statusFilter, garageFilter],
  )

  const { data, isLoading, isError, error } = useAdminWaitlists(params)
  const { allGarages } = useAdminGarages({})
  const { offerMutation, cancelMutation, expireMutation } = useAdminWaitlistMutations()

  const waitlists: ApiWaitlist[] = data?.waitlists ?? []
  const waitingCount = waitlists.filter((item) => item.status === 'WAITING').length
  const offeredCount = waitlists.filter((item) => item.status === 'OFFERED').length

  useEffect(() => {
    if (isError) {
      showToast(getApiErrorMessage(error, 'Không tải được danh sách chờ.'), 'error')
    }
  }, [isError, error, showToast])

  const handleConfirm = async () => {
    if (!confirmAction) return

    try {
      if (confirmAction.type === 'offer') {
        await offerMutation.mutateAsync({ waitlistId: confirmAction.id })
        showToast('Đã gửi lời mời slot cho khách.', 'success')
      } else if (confirmAction.type === 'cancel') {
        await cancelMutation.mutateAsync({ waitlistId: confirmAction.id })
        showToast('Đã hủy yêu cầu chờ.', 'success')
      } else {
        await expireMutation.mutateAsync(confirmAction.id)
        showToast('Đã đánh dấu hết hạn.', 'success')
      }
      setConfirmAction(null)
    } catch (mutationError) {
      showToast(getApiErrorMessage(mutationError, 'Thao tác thất bại.'), 'error')
    }
  }

  const isMutating =
    offerMutation.isPending || cancelMutation.isPending || expireMutation.isPending

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Quản trị"
            title="Danh sách chờ"
            description="Quản lý waitlist toàn hệ thống — mời slot, hủy hoặc đánh dấu hết hạn."
          />

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Tổng bản ghi" value={waitlists.length} icon={Hourglass} accent="brand" />
            <StatCard label="Đang chờ" value={waitingCount} icon={Clock} accent="amber" />
            <StatCard label="Đã mời" value={offeredCount} icon={Send} accent="violet" />
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="carivo-panel p-4">
              <Label htmlFor="waitlist-status">Trạng thái</Label>
              <Select
                id="waitlist-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">Tất cả</option>
                {Object.entries(WAITLIST_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="carivo-panel p-4">
              <Label htmlFor="waitlist-garage">Chi nhánh</Label>
              <Select
                id="waitlist-garage"
                value={garageFilter}
                onChange={(event) => setGarageFilter(event.target.value)}
              >
                <option value="ALL">Tất cả garage</option>
                {allGarages.map((garage) => (
                  <option key={garage.id} value={garage.id}>
                    {garage.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{waitlists.length} yêu cầu chờ</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Khách</th>
                    <th className="px-6 py-3">Chi nhánh</th>
                    <th className="px-6 py-3">Gói dịch vụ</th>
                    <th className="px-6 py-3">Giờ mong muốn</th>
                    <th className="px-6 py-3">Trạng thái</th>
                    <th className="px-6 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlists.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100/80 hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">
                          {item.customer?.full_name ?? item.customer_id}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.vehicle?.raw_license_plate ?? item.vehicle_id} ·{' '}
                          {VEHICLE_TYPE_LABELS[item.vehicle_type]}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {item.garage?.name ?? item.garage_id}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {item.service_package?.name ?? item.service_package_id}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDateTime(item.desired_start_time)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="info">
                          {WAITLIST_STATUS_LABELS[item.status] ?? item.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {item.status === 'WAITING' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setConfirmAction({
                                  id: item.id,
                                  type: 'offer',
                                  label: item.customer?.full_name ?? item.id,
                                })
                              }
                            >
                              Mời slot
                            </Button>
                          ) : null}
                          {['WAITING', 'OFFERED'].includes(item.status) ? (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                setConfirmAction({
                                  id: item.id,
                                  type: 'cancel',
                                  label: item.customer?.full_name ?? item.id,
                                })
                              }
                            >
                              Hủy
                            </Button>
                          ) : null}
                          {item.status === 'OFFERED' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setConfirmAction({
                                  id: item.id,
                                  type: 'expire',
                                  label: item.customer?.full_name ?? item.id,
                                })
                              }
                            >
                              Hết hạn
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {waitlists.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-500">
                  Chưa có yêu cầu chờ nào.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Modal
            open={Boolean(confirmAction)}
            onClose={() => !isMutating && setConfirmAction(null)}
            title={
              confirmAction?.type === 'offer'
                ? 'Mời slot cho khách?'
                : confirmAction?.type === 'cancel'
                  ? 'Hủy yêu cầu chờ?'
                  : 'Đánh dấu hết hạn?'
            }
            description={confirmAction ? `Khách: ${confirmAction.label}` : undefined}
          >
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmAction(null)} disabled={isMutating}>
                Đóng
              </Button>
              <Button onClick={() => void handleConfirm()} disabled={isMutating}>
                {isMutating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận'
                )}
              </Button>
            </div>
          </Modal>
        </>
      )}
    </div>
  )
}
