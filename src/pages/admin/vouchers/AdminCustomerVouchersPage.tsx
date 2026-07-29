import {
  Hourglass,
  Loader2,
  RotateCcw,
  Ticket,
  CheckCircle2,
  Gift,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { CopyValueButton } from '../../../components/ui/CopyValueButton'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Label } from '../../../components/ui/Label'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { Textarea } from '../../../components/ui/Textarea'
import { useToast } from '../../../contexts/ToastContext'
import {
  ADMIN_CUSTOMER_VOUCHER_SOURCE_LABELS,
  ADMIN_CUSTOMER_VOUCHER_STATUS_LABELS,
  ADMIN_CUSTOMER_VOUCHER_STATUS_VARIANT,
  ADMIN_CUSTOMER_VOUCHER_TYPE_LABELS,
  useAdminCustomerVoucherMutations,
  useAdminCustomerVouchers,
} from '../../../hooks/api/admin/useAdminCustomerVouchers'
import type { ApiCustomerVoucher } from '../../../types/api/staff'
import { formatDateTime } from '../../../utils/format'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  ...Object.entries(ADMIN_CUSTOMER_VOUCHER_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
]

const SOURCE_OPTIONS = [
  { value: 'ALL', label: 'Tất cả nguồn' },
  ...Object.entries(ADMIN_CUSTOMER_VOUCHER_SOURCE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
]

type ConfirmAction = 'approve' | 'revoke' | null

function formatVoucherValue(voucher: ApiCustomerVoucher): string {
  if (voucher.voucher_type === 'PERCENTAGE') return `${voucher.value}%`
  if (voucher.voucher_type === 'FREE_SERVICE') return 'Miễn phí'
  return `${voucher.value.toLocaleString('vi-VN')} đ`
}

function describeSource(voucher: ApiCustomerVoucher): string {
  if (voucher.source_type) {
    return ADMIN_CUSTOMER_VOUCHER_SOURCE_LABELS[voucher.source_type] ?? voucher.source_type
  }
  if (voucher.source_incident_id || voucher.source_booking_incident_id) {
    return 'Bồi thường sự cố'
  }
  if (voucher.source_customer_case_id) {
    return 'Hồ sơ khiếu nại'
  }
  return '—'
}

export function AdminCustomerVouchersPage() {
  const { showToast } = useToast()
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [sourceFilter, setSourceFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [pendingVoucher, setPendingVoucher] = useState<ApiCustomerVoucher | null>(null)
  const [confirmNote, setConfirmNote] = useState('')

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      source: sourceFilter === 'ALL' ? undefined : sourceFilter,
    }),
    [page, statusFilter, sourceFilter],
  )

  const { data, isLoading, isError, error } = useAdminCustomerVouchers(params)
  const { approveMutation, revokeMutation } = useAdminCustomerVoucherMutations()

  const vouchers: ApiCustomerVoucher[] = data?.vouchers ?? []
  const meta = data?.meta
  const totalPages = meta?.total_pages ?? 1
  const total = meta?.total ?? vouchers.length
  const issuedCount = vouchers.filter((item) => item.status === 'ISSUED').length
  const pendingCount = vouchers.filter(
    (item) => item.status === 'PENDING_APPROVAL',
  ).length
  const revokedCount = vouchers.filter((item) => item.status === 'REVOKED').length

  useEffect(() => {
    if (isError) {
      showToast(getApiErrorMessage(error, 'Không tải được danh sách voucher.'), 'error')
    }
  }, [isError, error, showToast])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, sourceFilter])

  const openConfirm = (action: ConfirmAction, voucher: ApiCustomerVoucher) => {
    setConfirmAction(action)
    setPendingVoucher(voucher)
    setConfirmNote('')
  }

  const closeConfirm = () => {
    setConfirmAction(null)
    setPendingVoucher(null)
    setConfirmNote('')
  }

  const handleConfirm = async () => {
    if (!pendingVoucher || !confirmAction) return
    try {
      if (confirmAction === 'approve') {
        await approveMutation.mutateAsync({
          voucherId: pendingVoucher.id,
          note: confirmNote.trim() || null,
        })
        showToast(`Đã duyệt voucher ${pendingVoucher.code}.`, 'success')
      } else {
        await revokeMutation.mutateAsync({
          voucherId: pendingVoucher.id,
          reason: confirmNote.trim() || undefined,
        })
        showToast(`Đã thu hồi voucher ${pendingVoucher.code}.`, 'success')
      }
      closeConfirm()
    } catch (caught) {
      showToast(
        getApiErrorMessage(
          caught,
          confirmAction === 'approve'
            ? 'Không duyệt được voucher.'
            : 'Không thu hồi được voucher.',
        ),
        'error',
      )
    }
  }

  const isMutating = approveMutation.isPending || revokeMutation.isPending

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Voucher customer"
        description="Quản lý voucher bồi thường và voucher admin tặng riêng cho từng customer."
        action={
          <Link to="/admin/users/customers">
            <Button>
              <Gift className="h-4 w-4" />
              Chọn customer để tặng
            </Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng voucher" value={total} icon={Ticket} accent="brand" />
        <StatCard
          label="Chờ duyệt"
          value={pendingCount}
          icon={Hourglass}
          accent="amber"
        />
        <StatCard
          label="Đã phát hành (trang này)"
          value={issuedCount}
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          label="Đã thu hồi (trang này)"
          value={revokedCount}
          icon={XCircle}
          accent="violet"
        />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="carivo-panel p-4">
          <Label htmlFor="admin-voucher-status">Trạng thái</Label>
          <Select
            id="admin-voucher-status"
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
          <Label htmlFor="admin-voucher-source">Nguồn phát hành</Label>
          <Select
            id="admin-voucher-source"
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
          >
            {SOURCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {total} voucher
            {meta ? ` · Trang ${meta.page}/${meta.total_pages}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {isLoading ? (
            <div className="p-6">
              <DashboardPageSkeleton />
            </div>
          ) : vouchers.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="Không có voucher nào"
              description="Thử chuyển bộ lọc trạng thái về 'Tất cả trạng thái' để xem toàn bộ voucher."
            />
          ) : (
            <table className="w-full min-w-[1240px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Mã voucher</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Chi nhánh</th>
                  <th className="px-6 py-3">Loại</th>
                  <th className="px-6 py-3">Giá trị</th>
                  <th className="px-6 py-3">Nguồn</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Hết hạn</th>
                  <th className="px-6 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-mono text-slate-900">
                        {voucher.code}
                        <CopyValueButton
                          value={voucher.code}
                          label="mã voucher"
                          className="text-slate-500"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {voucher.customer_id ? (
                        <Link
                          to={`/admin/users/customers/${voucher.customer_id}`}
                          className="carivo-link"
                        >
                          {voucher.customer?.full_name ?? voucher.customer_id}
                        </Link>
                      ) : (
                        '—'
                      )}
                      {voucher.customer?.phone ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {voucher.customer.phone}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {voucher.garage?.name ?? voucher.garage_id ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {ADMIN_CUSTOMER_VOUCHER_TYPE_LABELS[voucher.voucher_type] ??
                        voucher.voucher_type}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {formatVoucherValue(voucher)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {describeSource(voucher)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          ADMIN_CUSTOMER_VOUCHER_STATUS_VARIANT[voucher.status] ??
                          'default'
                        }
                      >
                        {ADMIN_CUSTOMER_VOUCHER_STATUS_LABELS[voucher.status] ??
                          voucher.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {voucher.expires_at
                        ? formatDateTime(voucher.expires_at)
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        {voucher.status === 'PENDING_APPROVAL' ? (
                          <Button
                            size="sm"
                            onClick={() => openConfirm('approve', voucher)}
                            disabled={isMutating}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Duyệt
                          </Button>
                        ) : null}
                        {voucher.status === 'PENDING_APPROVAL' ||
                        voucher.status === 'ISSUED' ? (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => openConfirm('revoke', voucher)}
                            disabled={isMutating}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Thu hồi
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
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

      <Modal
        open={confirmAction !== null && pendingVoucher !== null}
        onClose={closeConfirm}
        title={
          confirmAction === 'approve' ? 'Duyệt voucher bồi thường' : 'Thu hồi voucher'
        }
        description={
          pendingVoucher
            ? `Voucher ${pendingVoucher.code} · ${formatVoucherValue(pendingVoucher)}`
            : ''
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {confirmAction === 'approve'
              ? 'Voucher sẽ chuyển sang trạng thái Đã phát hành và khách hàng có thể sử dụng ngay.'
              : 'Voucher sẽ bị thu hồi — khách hàng sẽ không thể dùng mã này nữa. Chỉ thu hồi các voucher chưa sử dụng.'}
          </p>
          <div>
            <Label htmlFor="voucher-confirm-note">
              {confirmAction === 'approve' ? 'Ghi chú duyệt (tuỳ chọn)' : 'Lý do thu hồi'}
            </Label>
            <Textarea
              id="voucher-confirm-note"
              rows={3}
              value={confirmNote}
              onChange={(event) => setConfirmNote(event.target.value)}
              placeholder={
                confirmAction === 'approve'
                  ? 'VD: Khách hàng đồng ý phương án bồi thường'
                  : 'VD: Khách đổi sang voucher khác, voucher hết hạn...'
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeConfirm} disabled={isMutating}>
              Huỷ
            </Button>
            <Button
              variant={confirmAction === 'revoke' ? 'danger' : 'primary'}
              onClick={() => void handleConfirm()}
              disabled={isMutating}
            >
              {isMutating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : confirmAction === 'approve' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              {confirmAction === 'approve' ? 'Duyệt voucher' : 'Thu hồi'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
