import { Clock, Hourglass, Loader2, Send } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../../api/client'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { VEHICLE_TYPE_LABELS } from '../../../constants/washBayStatus'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminGarages } from '../../../hooks/api/admin/useAdminGarages'
import { useAdminServicePackages } from '../../../hooks/api/admin/useAdminServicePackages'
import {
  DEFAULT_OFFER_EXPIRE_MINUTES,
  useAdminWaitlistMutations,
  useAdminWaitlists,
  WAITLIST_STATUS_LABELS,
} from '../../../hooks/api/admin/useAdminWaitlists'
import type { ApiWaitlist } from '../../../types/api/admin'
import { formatDateTime } from '../../../utils/format'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  ...Object.entries(WAITLIST_STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

const VEHICLE_TYPE_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  ...Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
]

type ConfirmActionType = 'offer' | 'cancel' | 'expire'

export function AdminWaitlistsPage() {
  const { showToast } = useToast()
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [garageFilter, setGarageFilter] = useState<string>('ALL')
  const [servicePackageFilter, setServicePackageFilter] = useState<string>('ALL')
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('ALL')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [page, setPage] = useState(1)
  const [confirmAction, setConfirmAction] = useState<{
    id: string
    type: ConfirmActionType
    label: string
  } | null>(null)
  const [offerMinutes, setOfferMinutes] = useState<number>(DEFAULT_OFFER_EXPIRE_MINUTES)
  const [cancelReason, setCancelReason] = useState<string>('')

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      status:
        statusFilter === 'ALL'
          ? undefined
          : (statusFilter as 'WAITING' | 'OFFERED' | 'ACCEPTED' | 'CANCELED' | 'EXPIRED'),
      garage_id: garageFilter === 'ALL' ? undefined : garageFilter,
      service_package_id:
        servicePackageFilter === 'ALL' ? undefined : servicePackageFilter,
      vehicle_type:
        vehicleTypeFilter === 'ALL'
          ? undefined
          : (vehicleTypeFilter as 'MOTORBIKE' | 'CAR'),
      from: fromDate ? new Date(fromDate).toISOString() : undefined,
      to: toDate ? new Date(toDate).toISOString() : undefined,
    }),
    [
      page,
      statusFilter,
      garageFilter,
      servicePackageFilter,
      vehicleTypeFilter,
      fromDate,
      toDate,
    ],
  )

  const { data, isLoading, isError, error } = useAdminWaitlists(params)
  const { allGarages } = useAdminGarages({})
  const { allPackages } = useAdminServicePackages({})
  const { offerMutation, cancelMutation, expireMutation } = useAdminWaitlistMutations()

  const waitlists: ApiWaitlist[] = data?.waitlists ?? []
  const meta = data?.meta
  const totalPages = meta?.total_pages ?? 1
  const total = meta?.total ?? waitlists.length
  const waitingCount = waitlists.filter((item) => item.status === 'WAITING').length
  const offeredCount = waitlists.filter((item) => item.status === 'OFFERED').length

  useEffect(() => {
    if (isError) {
      showToast(getApiErrorMessage(error, 'Không tải được danh sách chờ.'), 'error')
    }
  }, [isError, error, showToast])

  useEffect(() => {
    setPage(1)
  }, [
    statusFilter,
    garageFilter,
    servicePackageFilter,
    vehicleTypeFilter,
    fromDate,
    toDate,
  ])

  const openConfirm = (
    id: string,
    type: ConfirmActionType,
    label: string,
  ) => {
    setOfferMinutes(DEFAULT_OFFER_EXPIRE_MINUTES)
    setCancelReason('')
    setConfirmAction({ id, type, label })
  }

  const handleConfirm = async () => {
    if (!confirmAction) return

    try {
      if (confirmAction.type === 'offer') {
        await offerMutation.mutateAsync({
          waitlistId: confirmAction.id,
          offerExpiresInMinutes: offerMinutes,
        })
        showToast(
          `Đã gửi lời mời slot (có hiệu lực ${offerMinutes} phút) cho khách.`,
          'success',
        )
      } else if (confirmAction.type === 'cancel') {
        await cancelMutation.mutateAsync({
          waitlistId: confirmAction.id,
          reason: cancelReason.trim() || undefined,
        })
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

  const confirmTitle =
    confirmAction?.type === 'offer'
      ? 'Mời slot cho khách?'
      : confirmAction?.type === 'cancel'
        ? 'Hủy yêu cầu chờ?'
        : 'Đánh dấu hết hạn?'

  const confirmDescription =
    confirmAction?.type === 'expire'
      ? `Thao tác này sẽ hủy lời mời slot hiện tại của khách: ${confirmAction.label}.`
      : confirmAction
        ? `Khách: ${confirmAction.label}`
        : undefined

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
            <StatCard
              label="Tổng bản ghi"
              value={total}
              icon={Hourglass}
              accent="brand"
            />
            <StatCard
              label="Đang chờ (trang này)"
              value={waitingCount}
              icon={Clock}
              accent="amber"
            />
            <StatCard
              label="Đã mời (trang này)"
              value={offeredCount}
              icon={Send}
              accent="violet"
            />
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="carivo-panel p-4">
              <Label htmlFor="waitlist-status">Trạng thái</Label>
              <Select
                id="waitlist-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
            <div className="carivo-panel p-4">
              <Label htmlFor="waitlist-service-package">Gói dịch vụ</Label>
              <Select
                id="waitlist-service-package"
                value={servicePackageFilter}
                onChange={(event) => setServicePackageFilter(event.target.value)}
              >
                <option value="ALL">Tất cả gói</option>
                {allPackages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="carivo-panel p-4">
              <Label htmlFor="waitlist-vehicle-type">Loại xe</Label>
              <Select
                id="waitlist-vehicle-type"
                value={vehicleTypeFilter}
                onChange={(event) => setVehicleTypeFilter(event.target.value)}
              >
                {VEHICLE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="carivo-panel p-4">
              <Label htmlFor="waitlist-from">Từ ngày</Label>
              <Input
                id="waitlist-from"
                type="datetime-local"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>
            <div className="carivo-panel p-4">
              <Label htmlFor="waitlist-to">Đến ngày</Label>
              <Input
                id="waitlist-to"
                type="datetime-local"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {total} yêu cầu chờ
                {meta ? ` · Trang ${meta.page}/${meta.total_pages}` : ''}
              </CardTitle>
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
                    <tr
                      key={item.id}
                      className="border-b border-slate-100/80 hover:bg-slate-50/50"
                    >
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
                                openConfirm(item.id, 'offer', item.customer?.full_name ?? item.id)
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
                                openConfirm(item.id, 'cancel', item.customer?.full_name ?? item.id)
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
                                openConfirm(item.id, 'expire', item.customer?.full_name ?? item.id)
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
            {meta && meta.total_pages > 1 ? (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-sm text-slate-600">
                <span>
                  Trang {meta.page} / {meta.total_pages} · {meta.total} bản ghi
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1 || isLoading}
                  >
                    Trước
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    disabled={page >= totalPages || isLoading}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>

          <Modal
            open={Boolean(confirmAction)}
            onClose={() => !isMutating && setConfirmAction(null)}
            title={confirmTitle}
            description={confirmDescription}
          >
            <div className="space-y-4">
              {confirmAction?.type === 'offer' ? (
                <div className="space-y-2">
                  <Label htmlFor="offer-expires-minutes">
                    Thời hạn lời mời (phút)
                  </Label>
                  <Input
                    id="offer-expires-minutes"
                    type="number"
                    min={1}
                    max={1440}
                    value={offerMinutes}
                    onChange={(event) => {
                      const next = Number(event.target.value)
                      if (Number.isFinite(next)) {
                        setOfferMinutes(Math.min(1440, Math.max(1, next)))
                      }
                    }}
                  />
                  <p className="text-xs text-slate-500">
                    Tối đa 1440 phút (24 giờ). Mặc định{' '}
                    {DEFAULT_OFFER_EXPIRE_MINUTES} phút.
                  </p>
                </div>
              ) : null}

              {confirmAction?.type === 'cancel' ? (
                <div className="space-y-2">
                  <Label htmlFor="cancel-reason">Lý do hủy (tuỳ chọn)</Label>
                  <Input
                    id="cancel-reason"
                    type="text"
                    maxLength={500}
                    placeholder="Nhập lý do nếu cần"
                    value={cancelReason}
                    onChange={(event) => setCancelReason(event.target.value)}
                  />
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setConfirmAction(null)}
                  disabled={isMutating}
                >
                  Hủy bỏ
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
            </div>
          </Modal>
        </>
      )}
    </div>
  )
}