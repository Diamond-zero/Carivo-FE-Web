import { ArrowLeft, Ban, Clock, Loader2, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminPaymentAuditTrail } from '../../../components/admin/payment/AdminPaymentAuditTrail'
import { AdminPaymentBookingCard } from '../../../components/admin/payment/AdminPaymentBookingCard'
import { AdminPaymentCancelModal } from '../../../components/admin/payment/AdminPaymentCancelModal'
import { AdminPaymentDetailCard } from '../../../components/admin/payment/AdminPaymentDetailCard'
import { AdminPaymentStatusBadge } from '../../../components/admin/payment/AdminPaymentStatusBadge'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import {
  ADMIN_PAYMENT_CANCELLABLE_STATUSES,
  ADMIN_PAYMENT_EXPIRABLE_STATUSES,
} from '../../../constants/adminPayment'
import {
  useAdminPaymentByBooking,
  useAdminPaymentDetail,
  useAdminPaymentMutations,
  useAdminPaymentPolling,
} from '../../../hooks/api/admin/useAdminPayments'

export function AdminPaymentDetailPage() {
  const params = useParams<{ paymentId?: string; bookingId?: string }>()
  const { showToast } = useToast()

  const paymentId = params.paymentId
  const bookingId = params.bookingId

  const detailQuery = useAdminPaymentDetail(paymentId)
  const byBookingQuery = useAdminPaymentByBooking(bookingId)
  const pollingQuery = useAdminPaymentPolling(bookingId)

  const payment = paymentId ? detailQuery.data?.payment : byBookingQuery.data?.payment
  const linkedBooking = detailQuery.data?.booking
  const isPending = pollingQuery.isFetching || byBookingQuery.isFetching

  const { cancelMutation, expireMutation } = useAdminPaymentMutations()

  const [cancelTarget, setCancelTarget] = useState<string | null>(null)

  // Trigger toast error
  useEffect(() => {
    if (detailQuery.isError) {
      showToast(
        getApiErrorMessage(detailQuery.error, 'Không tải được chi tiết payment.'),
        'error',
      )
    }
    if (byBookingQuery.isError) {
      showToast(
        getApiErrorMessage(byBookingQuery.error, 'Không tải được payment cho booking.'),
        'error',
      )
    }
  }, [detailQuery, byBookingQuery, showToast])

  const handleCancel = async (paymentId: string, reason: string) => {
    try {
      await cancelMutation.mutateAsync({ paymentId, reason })
      showToast('Đã huỷ giao dịch.', 'success')
      setCancelTarget(null)
      void detailQuery.refetch()
      void byBookingQuery.refetch()
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Huỷ thất bại.'), 'error')
    }
  }

  const handleExpire = async (paymentId: string) => {
    try {
      await expireMutation.mutateAsync(paymentId)
      showToast('Đã đánh dấu hết hạn.', 'success')
      void detailQuery.refetch()
      void byBookingQuery.refetch()
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Đánh dấu hết hạn thất bại.'), 'error')
    }
  }

  const isLoading = (paymentId && detailQuery.isLoading) || (bookingId && byBookingQuery.isLoading)

  if (isLoading) {
    return (
      <div>
        <PageHeader
          eyebrow="Carivo Quản trị"
          title="Chi tiết thanh toán"
          description="Đang tải giao dịch…"
        />
        <DashboardPageSkeleton />
      </div>
    )
  }

  if (!payment) {
    return (
      <div>
        <PageHeader
          eyebrow="Carivo Quản trị"
          title="Không tìm thấy giao dịch"
          description="Giao dịch không tồn tại hoặc đã bị xoá."
          action={
            <Link
              to="/admin/payments"
              className="carivo-link inline-flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại danh sách
            </Link>
          }
        />
      </div>
    )
  }

  const canCancel = ADMIN_PAYMENT_CANCELLABLE_STATUSES.includes(payment.status)
  const canExpire = ADMIN_PAYMENT_EXPIRABLE_STATUSES.includes(payment.status)

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title={`Giao dịch ${payment.id}`}
        description={
          isPending
            ? 'Đang đồng bộ trạng thái…'
            : 'Xem chi tiết giao dịch PayOS, lịch sửa thao tác và tác vụ quản trị.'
        }
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/admin/payments"
              className="carivo-link inline-flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Danh sách
            </Link>
          </div>
        }
      />

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <AdminPaymentDetailCard payment={payment} />

          {linkedBooking ? (
            <AdminPaymentBookingCard booking={linkedBooking} />
          ) : null}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Tác vụ quản trị
                </CardTitle>
                <AdminPaymentStatusBadge status={payment.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">
                Các thao tác dưới đây ảnh hưởng trực tiếp đến payment PayOS và
                trạng thái thanh toán của booking. Hành động sẽ được ghi log
                trong hệ thống.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => void detailQuery.refetch()}
                  disabled={detailQuery.isFetching}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${detailQuery.isFetching ? 'animate-spin' : ''}`}
                  />
                  Làm mới
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setCancelTarget(payment.id)}
                  disabled={!canCancel || cancelMutation.isPending}
                >
                  <Ban className="h-4 w-4" />
                  Huỷ giao dịch
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => void handleExpire(payment.id)}
                  disabled={!canExpire || expireMutation.isPending}
                >
                  {expireMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                  Đánh dấu hết hạn
                </Button>
              </div>
              {!canCancel && !canExpire ? (
                <p className="text-xs text-slate-500">
                  Giao dịch đã ở trạng thái terminal — không thể huỷ hoặc expire.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử giao dịch</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminPaymentAuditTrail payment={payment} />
            </CardContent>
          </Card>
        </div>
      </div>

      <AdminPaymentCancelModal
        open={cancelTarget !== null}
        paymentId={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        isPending={cancelMutation.isPending}
      />
    </div>
  )
}
