import { Clock, Hourglass, Loader2, Send } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../api/client'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { StatCard } from '../../components/ui/StatCard'
import { VEHICLE_TYPE_LABELS } from '../../constants/washBayStatus'
import { useToast } from '../../contexts/ToastContext'
import {
  DEFAULT_OFFER_EXPIRE_MINUTES,
  WAITLIST_STATUS_LABELS,
  WAITLIST_STATUS_VARIANT,
  useStaffWaitlistMutations,
  useStaffWaitlists,
} from '../../hooks/api/staff/useStaffWaitlists'
import type { ApiWaitlist } from '../../types/api/admin'
import { formatDateTime } from '../../utils/format'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  ...Object.entries(WAITLIST_STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

const VEHICLE_TYPE_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'MOTORBIKE', label: VEHICLE_TYPE_LABELS.MOTORBIKE ?? 'Xe máy' },
  { value: 'CAR', label: VEHICLE_TYPE_LABELS.CAR ?? 'Ô tô' },
]

type ConfirmActionType = 'offer' | 'cancel' | 'expire'

export function StaffWaitlistListPage() {
  const { showToast } = useToast()
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
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
      vehicle_type:
        vehicleTypeFilter === 'ALL'
          ? undefined
          : (vehicleTypeFilter as 'MOTORBIKE' | 'CAR'),
      from: fromDate ? new Date(fromDate).toISOString() : undefined,
      to: toDate ? new Date(toDate).toISOString() : undefined,
    }),
    [page, statusFilter, vehicleTypeFilter, fromDate, toDate],
  )

  const { data, isLoading, isError, error } = useStaffWaitlists(params)
  const { offerMutation, cancelMutation, expireMutation } = useStaffWaitlistMutations()

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
  }, [statusFilter, vehicleTypeFilter, fromDate, toDate])

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

  const confirmDescription = confirmAction
    ? `Khách: ${confirmAction.label}`
    : undefined

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Staff"
            title="Danh sách chờ"
            description="Quản lý waitlist tại chi nhánh của bạn — mời slot cho khách, hủy hoặc đánh dấu hết hạn."
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

          <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              {waitlists.length === 0 ? (
                <EmptyState
                  icon={Hourglass}
                  title="Chưa có yêu cầu chờ"
                  description="Khi khách hàng đăng ký chờ slot tại chi nhánh của bạn, danh sách sẽ hiển thị ở đây."
                />
              ) : (
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3">Khách</th>
                      <th className="px-6 py-3">Biển số</th>
                      <th className="px-6 py-3">Gói dịch vụ</th>
                      <th className="px-6 py-3">Giờ mong muốn</th>
                      <th className="px-6 py-3">Trạng thái</th>
                      <th className="px-6 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {waitlists.map((item) => {
                      const canOffer = item.status === 'WAITING'
                      const canCancel = item.status === 'WAITING' || item.status === 'OFFERED'
                      const canExpire = item.status === 'OFFERED'
                      const customerLabel =
                        item.customer?.full_name ?? '(khách không xác định)'
                      const plate = item.vehicle?.raw_license_plate ?? '—'
                      const pkgName = item.service_package?.name ?? '—'
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">
                              {customerLabel}
                            </div>
                            {item.customer?.phone ? (
                              <div className="text-xs text-slate-500">
                                {item.customer.phone}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-6 py-4 text-slate-700">{plate}</td>
                          <td className="px-6 py-4 text-slate-700">{pkgName}</td>
                          <td className="px-6 py-4 text-slate-700">
                            {formatDateTime(item.desired_start_time)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={WAITLIST_STATUS_VARIANT[item.status] ?? 'default'}>
                              {WAITLIST_STATUS_LABELS[item.status] ?? item.status}
                            </Badge>
                            {item.status === 'OFFERED' && item.offer_expires_at ? (
                              <div className="mt-1 text-xs text-slate-500">
                                Hết hạn: {formatDateTime(item.offer_expires_at)}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              {canOffer ? (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => openConfirm(item.id, 'offer', customerLabel)}
                                >
                                  Mời slot
                                </Button>
                              ) : null}
                              {canCancel ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => openConfirm(item.id, 'cancel', customerLabel)}
                                >
                                  Hủy
                                </Button>
                              ) : null}
                              {canExpire ? (
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => openConfirm(item.id, 'expire', customerLabel)}
                                >
                                  Hết hạn
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
              >
                Trang trước
              </Button>
              <span>
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
              >
                Trang sau
              </Button>
            </div>
          ) : null}
        </>
      )}

      <Modal
        open={Boolean(confirmAction)}
        onClose={() => (isMutating ? null : setConfirmAction(null))}
        title={confirmTitle}
        description={confirmDescription}
      >
        <div className="space-y-4">
          {confirmAction?.type === 'offer' ? (
            <div>
              <Label htmlFor="offer-minutes" required>
                Thời hạn lời mời (phút)
              </Label>
              <Input
                id="offer-minutes"
                type="number"
                min={1}
                max={120}
                value={offerMinutes}
                onChange={(event) => setOfferMinutes(Number(event.target.value))}
              />
            </div>
          ) : null}
          {confirmAction?.type === 'cancel' ? (
            <div>
              <Label htmlFor="cancel-reason">Lý do hủy (tùy chọn)</Label>
              <textarea
                id="cancel-reason"
                rows={3}
                className="min-h-[80px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder="Nhập lý do (nếu có)…"
              />
            </div>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmAction(null)}
              disabled={isMutating}
            >
              Hủy
            </Button>
            <Button onClick={handleConfirm} disabled={isMutating}>
              {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Xác nhận
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}