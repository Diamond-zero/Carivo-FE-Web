import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  Search,
  ShieldAlert,
  WalletCards,
} from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adjustAdminBookingViolationScoreApi,
  getAdminBookingViolationAppealsApi,
  getAdminBookingViolationDetailApi,
  getAdminBookingViolationsApi,
  reviewAdminBookingViolationAppealApi,
} from '../../../api/bookingViolation.api'
import { getApiErrorMessage } from '../../../api/client'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { CopyValueButton } from '../../../components/ui/CopyValueButton'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { Textarea } from '../../../components/ui/Textarea'
import { useToast } from '../../../contexts/ToastContext'
import type {
  BookingViolationAppeal,
  BookingViolationRiskStatus,
  BookingViolationStatus,
} from '../../../types/bookingViolation'
import { formatDateTime } from '../../../utils/format'

const PAGE_SIZE = 20

const riskLabels: Record<BookingViolationRiskStatus, string> = {
  NORMAL: 'Bình thường',
  WARNING: 'Cảnh báo',
  DEPOSIT_REQUIRED: 'Yêu cầu đặt cọc',
  BLOCKED: 'Đang bị khóa',
}

const riskVariants: Record<
  BookingViolationRiskStatus,
  'success' | 'warning' | 'danger' | 'info'
> = {
  NORMAL: 'success',
  WARNING: 'warning',
  DEPOSIT_REQUIRED: 'info',
  BLOCKED: 'danger',
}

const eventLabels: Record<string, string> = {
  CANCEL: 'Khách hủy lịch',
  LATE_CANCEL: 'Hủy sát giờ',
  REPEATED_CANCEL: 'Đặt và hủy liên tục',
  NO_SHOW: 'Không đến',
  COMPLETED: 'Hoàn thành và thanh toán',
  ADMIN_ADJUSTMENT: 'Admin điều chỉnh',
  INACTIVITY_RECOVERY: 'Phục hồi sau 60 ngày',
  APPEAL_REVERSAL: 'Hoàn điểm do khiếu nại',
}

function readableDate(value: string | null) {
  return value ? formatDateTime(value) : 'Chưa có'
}

export function AdminBookingViolationsPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())
  const [riskFilter, setRiskFilter] = useState<'ALL' | BookingViolationRiskStatus>('ALL')
  const [selectedCustomer, setSelectedCustomer] =
    useState<BookingViolationStatus | null>(null)
  const [adjustmentOpen, setAdjustmentOpen] = useState(false)
  const [scoreChange, setScoreChange] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [selectedAppeal, setSelectedAppeal] =
    useState<BookingViolationAppeal | null>(null)
  const [appealDecision, setAppealDecision] =
    useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [appealNote, setAppealNote] = useState('')

  const listParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      risk_status: riskFilter === 'ALL' ? undefined : riskFilter,
      search: deferredSearch || undefined,
    }),
    [deferredSearch, page, riskFilter],
  )

  const customersQuery = useQuery({
    queryKey: ['admin', 'booking-violations', listParams],
    queryFn: () => getAdminBookingViolationsApi(listParams),
  })

  const appealsQuery = useQuery({
    queryKey: ['admin', 'booking-violation-appeals', 'PENDING'],
    queryFn: () =>
      getAdminBookingViolationAppealsApi({
        page: 1,
        limit: 100,
        status: 'PENDING',
      }),
  })

  const detailQuery = useQuery({
    queryKey: [
      'admin',
      'booking-violation-detail',
      selectedCustomer?.customer_id,
    ],
    queryFn: () =>
      getAdminBookingViolationDetailApi(selectedCustomer!.customer_id!),
    enabled: Boolean(selectedCustomer?.customer_id),
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['admin', 'booking-violations'],
    })
    await queryClient.invalidateQueries({
      queryKey: ['admin', 'booking-violation-appeals'],
    })
  }

  const adjustmentMutation = useMutation({
    mutationFn: () =>
      adjustAdminBookingViolationScoreApi(selectedCustomer!.customer_id!, {
        score_change: Number(scoreChange),
        reason: adjustmentReason.trim(),
      }),
    onSuccess: async () => {
      await invalidate()
      setAdjustmentOpen(false)
      setScoreChange('')
      setAdjustmentReason('')
      showToast('Đã điều chỉnh điểm vi phạm và ghi nhật ký hệ thống.', 'success')
    },
    onError: (error) => {
      showToast(
        getApiErrorMessage(error, 'Không thể điều chỉnh điểm vi phạm.'),
        'error',
      )
    },
  })

  const reviewMutation = useMutation({
    mutationFn: () =>
      reviewAdminBookingViolationAppealApi(selectedAppeal!.id, {
        status: appealDecision,
        admin_note: appealNote.trim(),
      }),
    onSuccess: async () => {
      await invalidate()
      setSelectedAppeal(null)
      setAppealNote('')
      showToast('Đã xử lý khiếu nại và thông báo cho customer.', 'success')
    },
    onError: (error) => {
      showToast(
        getApiErrorMessage(error, 'Không thể xử lý khiếu nại.'),
        'error',
      )
    },
  })

  useEffect(() => {
    setPage(1)
  }, [deferredSearch, riskFilter])

  useEffect(() => {
    if (customersQuery.error) {
      showToast(
        getApiErrorMessage(
          customersQuery.error,
          'Không tải được danh sách điểm vi phạm.',
        ),
        'error',
      )
    }
  }, [customersQuery.error, showToast])

  const customers = customersQuery.data?.items ?? []
  const appeals = appealsQuery.data?.items ?? []
  const totalPages = customersQuery.data?.meta.total_pages ?? 1
  const currentPageRiskCount = customers.reduce(
    (result, item) => {
      result[item.risk_status] += 1
      return result
    },
    { NORMAL: 0, WARNING: 0, DEPOSIT_REQUIRED: 0, BLOCKED: 0 },
  )

  const submitAdjustment = () => {
    const parsedScore = Number(scoreChange)
    if (!Number.isInteger(parsedScore) || parsedScore === 0) {
      showToast('Điểm điều chỉnh phải là số nguyên khác 0.', 'error')
      return
    }
    if (adjustmentReason.trim().length < 5) {
      showToast('Lý do điều chỉnh phải có ít nhất 5 ký tự.', 'error')
      return
    }
    adjustmentMutation.mutate()
  }

  const submitAppealReview = () => {
    if (appealNote.trim().length < 5) {
      showToast('Ghi chú xử lý phải có ít nhất 5 ký tự.', 'error')
      return
    }
    reviewMutation.mutate()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Điểm vi phạm booking"
        description="Theo dõi độ tin cậy đặt lịch, xử lý khiếu nại và điều chỉnh điểm có lưu audit log."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm text-slate-500">Cảnh báo trên trang</p>
              <p className="text-2xl font-bold">{currentPageRiskCount.WARNING}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <WalletCards className="h-8 w-8 text-brand-600" />
            <div>
              <p className="text-sm text-slate-500">Diện đặt cọc</p>
              <p className="text-2xl font-bold">
                {currentPageRiskCount.DEPOSIT_REQUIRED}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Ban className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-slate-500">Đang bị khóa</p>
              <p className="text-2xl font-bold">{currentPageRiskCount.BLOCKED}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Clock3 className="h-8 w-8 text-violet-500" />
            <div>
              <p className="text-sm text-slate-500">Khiếu nại chờ xử lý</p>
              <p className="text-2xl font-bold">
                {appealsQuery.data?.meta.total ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Khiếu nại đang chờ xử lý</CardTitle>
        </CardHeader>
        <CardContent>
          {appealsQuery.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          ) : appeals.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Không có khiếu nại tồn đọng.
            </div>
          ) : (
            <div className="space-y-3">
              {appeals.slice(0, 5).map((appeal) => (
                <div
                  key={appeal.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 lg:flex-row lg:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {appeal.customer?.full_name || 'Customer'}
                      </p>
                      <Badge variant="warning">Chờ xử lý</Badge>
                      <span className="text-xs text-slate-500">
                        {appeal.event
                          ? eventLabels[appeal.event.event] ?? appeal.event.event
                          : 'Sự kiện không còn tồn tại'}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {appeal.reason}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedAppeal(appeal)
                      setAppealDecision('APPROVED')
                      setAppealNote('')
                    }}
                  >
                    Xem và xử lý
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-5 grid gap-4 md:grid-cols-[1fr_240px]">
        <div className="carivo-panel p-4">
          <Label htmlFor="violation-search">Tìm customer</Label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              id="violation-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tên, số điện thoại hoặc email"
              className="pl-10"
            />
          </div>
        </div>
        <div className="carivo-panel p-4">
          <Label htmlFor="risk-filter">Mức xử lý</Label>
          <Select
            id="risk-filter"
            className="mt-2"
            value={riskFilter}
            onChange={(event) =>
              setRiskFilter(
                event.target.value as 'ALL' | BookingViolationRiskStatus,
              )
            }
          >
            <option value="ALL">Tất cả</option>
            <option value="NORMAL">Bình thường</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DEPOSIT_REQUIRED">Yêu cầu đặt cọc</option>
            <option value="BLOCKED">Đang bị khóa</option>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {customersQuery.data?.meta.total ?? 0} customer có hồ sơ điểm
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {customersQuery.isLoading ? (
            <div className="p-6">
              <DashboardPageSkeleton />
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title="Không tìm thấy hồ sơ phù hợp"
              description="Chỉ customer đã phát sinh sự kiện điểm vi phạm hoặc phục hồi mới xuất hiện tại đây."
            />
          ) : (
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Điểm</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Khóa đến</th>
                  <th className="px-6 py-3">Lần gần nhất</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((item) => (
                  <tr key={item.customer_id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {item.customer?.full_name || 'Customer'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.customer?.phone || item.customer?.email || 'Chưa có liên hệ'}
                      </p>
                      {item.customer_id ? (
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <span className="max-w-36 truncate">{item.customer_id}</span>
                          <CopyValueButton
                            value={item.customer_id}
                            label="Sao chép customer ID"
                          />
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-xl font-bold text-slate-900">
                      {item.violation_score}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={riskVariants[item.risk_status]}>
                        {riskLabels[item.risk_status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {readableDate(item.booking_blocked_until)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {readableDate(item.last_event_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {item.customer_id ? (
                          <Link to={`/admin/users/customers/${item.customer_id}`}>
                            <Button size="sm" variant="ghost">
                              Hồ sơ
                            </Button>
                          </Link>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCustomer(item)}
                        >
                          <Eye className="h-4 w-4" />
                          Chi tiết
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-end gap-3">
        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => setPage((current) => current - 1)}
        >
          Trang trước
        </Button>
        <span className="text-sm text-slate-600">
          Trang {page}/{Math.max(totalPages, 1)}
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => setPage((current) => current + 1)}
        >
          Trang sau
        </Button>
      </div>

      <Modal
        open={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title="Chi tiết điểm vi phạm"
        description={selectedCustomer?.customer?.full_name || undefined}
        className="max-w-3xl"
      >
        {detailQuery.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
          </div>
        ) : detailQuery.data ? (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-500">Điểm hiện tại</p>
                <p className="mt-1 text-2xl font-bold">
                  {detailQuery.data.status.violation_score}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-500">Trạng thái</p>
                <Badge
                  className="mt-2"
                  variant={riskVariants[detailQuery.data.status.risk_status]}
                >
                  {riskLabels[detailQuery.data.status.risk_status]}
                </Badge>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase text-slate-500">Số lần khóa</p>
                <p className="mt-1 text-2xl font-bold">
                  {detailQuery.data.status.booking_block_count}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setAdjustmentOpen(true)}>
                Điều chỉnh điểm
              </Button>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-slate-900">
                Lịch sử cộng và trừ điểm
              </h3>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {detailQuery.data.history.length === 0 ? (
                  <p className="text-sm text-slate-500">Chưa có lịch sử.</p>
                ) : (
                  detailQuery.data.history.map((item) => (
                    <div
                      key={`${item.source}-${item.id}`}
                      className="rounded-xl border border-slate-200 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            {eventLabels[item.event] ?? item.event}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.booking_code
                              ? `Booking ${item.booking_code} · `
                              : ''}
                            {formatDateTime(item.created_at)}
                          </p>
                          {item.reason ? (
                            <p className="mt-2 text-sm text-slate-600">
                              {item.reason}
                            </p>
                          ) : null}
                        </div>
                        <Badge
                          variant={
                            item.score_change > 0
                              ? 'danger'
                              : item.score_change < 0
                                ? 'success'
                                : 'default'
                          }
                        >
                          {item.score_change > 0 ? '+' : ''}
                          {item.score_change} điểm
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-600">
            {getApiErrorMessage(
              detailQuery.error,
              'Không tải được chi tiết điểm vi phạm.',
            )}
          </p>
        )}
      </Modal>

      <Modal
        open={adjustmentOpen}
        onClose={() => setAdjustmentOpen(false)}
        title="Điều chỉnh điểm vi phạm"
        description="Bắt buộc nhập lý do. Thao tác sẽ được lưu vào audit log."
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="score-change">Mức thay đổi</Label>
            <Input
              id="score-change"
              type="number"
              min={-20}
              max={20}
              value={scoreChange}
              onChange={(event) => setScoreChange(event.target.value)}
              placeholder="Ví dụ: -1 hoặc 2"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="adjustment-reason">Lý do</Label>
            <Textarea
              id="adjustment-reason"
              value={adjustmentReason}
              onChange={(event) => setAdjustmentReason(event.target.value)}
              placeholder="Nêu rõ căn cứ điều chỉnh"
              className="mt-2"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAdjustmentOpen(false)}>
              Đóng
            </Button>
            <Button
              disabled={adjustmentMutation.isPending}
              onClick={submitAdjustment}
            >
              {adjustmentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Xác nhận
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(selectedAppeal)}
        onClose={() => setSelectedAppeal(null)}
        title="Xử lý khiếu nại điểm vi phạm"
        description={selectedAppeal?.customer?.full_name || undefined}
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">
              Nội dung customer gửi
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {selectedAppeal?.reason}
            </p>
          </div>
          <div>
            <Label htmlFor="appeal-decision">Quyết định</Label>
            <Select
              id="appeal-decision"
              value={appealDecision}
              onChange={(event) =>
                setAppealDecision(
                  event.target.value as 'APPROVED' | 'REJECTED',
                )
              }
              className="mt-2"
            >
              <option value="APPROVED">Chấp nhận và hoàn điểm</option>
              <option value="REJECTED">Từ chối</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="appeal-note">Kết luận gửi customer</Label>
            <Textarea
              id="appeal-note"
              value={appealNote}
              onChange={(event) => setAppealNote(event.target.value)}
              placeholder="Giải thích rõ căn cứ chấp nhận hoặc từ chối"
              className="mt-2"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSelectedAppeal(null)}>
              Đóng
            </Button>
            <Button
              disabled={reviewMutation.isPending}
              onClick={submitAppealReview}
            >
              {reviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Hoàn tất xử lý
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
