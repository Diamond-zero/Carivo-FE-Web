/**
 * Staff Handover Page — `/staff/handover/:bookingId`
 *
 * Flow bàn giao mới (đồng bộ với BE `booking-handovers` + `staff-booking-workflows`):
 *
 *   1. Sau khi staff bấm "Hoàn thành dịch vụ" (booking → COMPLETED), staff được
 *      navigate tới trang này.
 *
 *   2. Staff bấm "Chuẩn bị bàn giao" → BE `markReady`
 *      → handover.state = READY_FOR_CUSTOMER, customer_response = PENDING.
 *
 *   3. Khách xác nhận tình trạng xe:
 *        - Customer có tài khoản: tự xác nhận trên app/web của họ (BE accept).
 *        - Walk-in: staff bấm "Khách đã đồng ý tình trạng xe" → BE `walk-in-accept`.
 *
 *   4. Customer báo vấn đề → ON_HOLD + customer_case. Staff xử lý case, sau
 *      khi RESOLVED, khách sẽ xác nhận lại tại đây.
 *
 *   5. Sau khi customer_response = ACCEPTED, staff thu tiền (cash / PayOS).
 *      Card "Thanh toán" hiển thị ngay trên trang này, staff bấm trực tiếp —
 *      không cần đi vòng sang BookingDetailPage.
 *
 *   6. Staff bấm "Bàn giao xe" → BE `release` → handover.state = RELEASED.
 *      Yêu cầu payment_status = PAID | WAIVED.
 */
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  Truck,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../api/client'
import {
  HANDOVER_RESPONSE_LABELS,
  HANDOVER_STATE_LABELS,
  HANDOVER_STATE_VARIANT,
  type ApiBookingHandover,
} from '../../api/handover.api'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { Textarea } from '../../components/ui/Textarea'
import { useBookings } from '../../contexts/BookingContext'
import { useToast } from '../../contexts/ToastContext'
import {
  useReadyBookingHandoverMutation,
  useReleaseBookingHandoverMutation,
  useStaffBookingHandover,
  useWalkInAcceptHandoverMutation,
} from '../../hooks/api/staff/useStaffHandover'
import { useStaffBookingDetail } from '../../hooks/api/staff/useStaffBookingDetail'
import { formatDateTime } from '../../utils/format'

export function StaffHandoverPage() {
  const { bookingId } = useParams()
  const { showToast } = useToast()
  const [staffNotes, setStaffNotes] = useState('')
  const [walkInNote, setWalkInNote] = useState('')

  const detailQuery = useStaffBookingDetail(bookingId)
  const handoverQuery = useStaffBookingHandover(bookingId)
  const { markBookingPaid, createPayosPayment } = useBookings()

  const readyMutation = useReadyBookingHandoverMutation(bookingId ?? '')
  const walkInAcceptMutation = useWalkInAcceptHandoverMutation(bookingId ?? '')
  const releaseMutation = useReleaseBookingHandoverMutation(bookingId ?? '')

  if (detailQuery.isLoading || handoverQuery.isLoading) {
    return <DashboardPageSkeleton />
  }

  if (!bookingId || !detailQuery.data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Không tìm thấy booking
        </h1>
        <Link to="/bookings" className="mt-4">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </Link>
      </div>
    )
  }

  const booking = detailQuery.data
  const handover: ApiBookingHandover | undefined = handoverQuery.data
  const isWalkIn = booking.is_walk_in === true

  // ---------------------------------------------------------------------------
  // Trạng thái hiện tại + guard cho từng card
  // ---------------------------------------------------------------------------
  const bookingCompleted = booking.status === 'COMPLETED'
  const handoverReleased = handover?.state === 'RELEASED'
  const customerAccepted =
    handover?.customer_response === 'ACCEPTED' &&
    handover?.state === 'READY_FOR_CUSTOMER'
  const paymentSettled =
    booking.payment_status === 'PAID' || booking.payment_status === 'WAIVED'

  const canReady = bookingCompleted && !handover
  const canShowPayment = bookingCompleted && customerAccepted && !handoverReleased
  const canCollectCash =
    canShowPayment && booking.payment_status === 'UNPAID'
  const canCreatePayos =
    canShowPayment &&
    (booking.payment_status === 'UNPAID' ||
      booking.payment_status === 'PENDING')
  // Walk-in: staff bấm "Khách đã đồng ý tình trạng xe" khi READY_FOR_CUSTOMER + PENDING.
  const canWalkInAccept =
    isWalkIn &&
    handover?.state === 'READY_FOR_CUSTOMER' &&
    handover?.customer_response === 'PENDING'
  // Release OK khi khách accept + payment xong.
  const canRelease =
    !!handover &&
    !handoverReleased &&
    customerAccepted &&
    paymentSettled

  const isProcessing =
    readyMutation.isPending ||
    walkInAcceptMutation.isPending ||
    releaseMutation.isPending ||
    markBookingPaid.isPending ||
    createPayosPayment.isPending

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleReady = async () => {
    try {
      await readyMutation.mutateAsync({ note: staffNotes.trim() || undefined })
      showToast(
        'Đã chuẩn bị bàn giao — chờ khách xác nhận tình trạng xe.',
        'success',
      )
      setStaffNotes('')
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể chuẩn bị bàn giao.'),
        'error',
      )
    }
  }

  const handleWalkInAccept = async () => {
    try {
      await walkInAcceptMutation.mutateAsync({
        note: walkInNote.trim() || undefined,
      })
      showToast('Đã ghi nhận khách walk-in đồng ý tình trạng xe.', 'success')
      setWalkInNote('')
    } catch (error) {
      showToast(
        getApiErrorMessage(
          error,
          'Không thể ghi nhận khách walk-in đồng ý.',
        ),
        'error',
      )
    }
  }

  const handleCollectCash = async () => {
    if (!bookingId) return
    const result = await markBookingPaid(bookingId)
    if (result.success) {
      showToast(result.message, 'success')
    } else {
      showToast(result.message, 'error')
    }
  }

  const handleCreatePayos = async () => {
    if (!bookingId) return
    const result = await createPayosPayment(bookingId)
    if (result.success && result.checkoutUrl) {
      window.open(result.checkoutUrl, '_blank', 'noopener,noreferrer')
      showToast(
        'Đã tạo link PayOS — đưa khách quét QR trên cửa sổ mới.',
        'success',
      )
    } else if (!result.success) {
      showToast(result.message, 'error')
    }
  }

  const handleRelease = async () => {
    try {
      await releaseMutation.mutateAsync({})
      showToast('Đã bàn giao xe. Booking hoàn tất.', 'success')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể bàn giao xe.'), 'error')
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const stateBadge = handover?.state ?? 'PENDING'
  const stateLabel = handover
    ? HANDOVER_STATE_LABELS[handover.state] ?? handover.state
    : 'Chưa bắt đầu'
  const stateVariant = handover
    ? HANDOVER_STATE_VARIANT[handover.state] ?? 'default'
    : 'default'

  const responseLabel = handover
    ? HANDOVER_RESPONSE_LABELS[handover.customer_response] ??
      handover.customer_response
    : null

  const formatVnd = (value: number) =>
    new Intl.NumberFormat('vi-VN').format(value) + ' ₫'

  return (
    <div>
      <div className="mb-4">
        <Link
          to={`/bookings/${bookingId}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại booking
        </Link>
      </div>

      <PageHeader
        eyebrow="Carivo Staff"
        title={`Bàn giao xe · ${booking.id.replace('booking-', '#')}`}
        description={
          isWalkIn
            ? 'Khách vãng lai — staff ghi nhận phản hồi trực tiếp tại quầy.'
            : 'Chuẩn bị bàn giao xe cho khách và ghi nhận khách xác nhận tình trạng xe.'
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            {isWalkIn ? (
              <Badge variant="warning">Khách vãng lai</Badge>
            ) : null}
            <Badge variant={stateVariant as never} className="text-sm">
              {stateLabel}
            </Badge>
          </div>
        }
      />

      {responseLabel ? (
        <p className="mb-4 text-sm text-slate-600">
          Phản hồi khách: <span className="font-medium">{responseLabel}</span>
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ============================================================
            Bước 2: Chuẩn bị bàn giao
            ============================================================ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-5 w-5 text-slate-500" />
              Chuẩn bị bàn giao
            </CardTitle>
            <CardDescription>
              Lưu ảnh trước/sau dịch vụ và mở bước cho khách kiểm tra xe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Sau khi hoàn tất dịch vụ, nhấn nút bên dưới để thông báo cho khách
              rằng xe đã sẵn sàng để khách kiểm tra tình trạng.
            </p>
            <div>
              <label
                htmlFor="handover-notes"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Ghi chú cho khách (tùy chọn)
              </label>
              <Textarea
                id="handover-notes"
                rows={3}
                value={staffNotes}
                onChange={(event) => setStaffNotes(event.target.value)}
                placeholder="VD: Xe đã rửa sạch, kiểm tra áp suất lốp đạt chuẩn…"
                disabled={!canReady || isProcessing}
              />
            </div>
            <Button
              onClick={() => void handleReady()}
              disabled={!canReady || isProcessing}
              className="w-full"
            >
              {readyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {handover ? 'Đã chuẩn bị bàn giao' : 'Chuẩn bị bàn giao'}
            </Button>
            {handover?.ready_at ? (
              <p className="text-xs text-slate-500">
                Đã gửi lúc {formatDateTime(handover.ready_at)}
              </p>
            ) : null}
            {!bookingCompleted ? (
              <p className="text-xs text-amber-700">
                Booking chưa ở trạng thái COMPLETED — không thể chuẩn bị bàn
                giao. Hoàn tất dịch vụ trước.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* ============================================================
            Bước 3: Ghi nhận khách xác nhận
            ============================================================ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isWalkIn ? 'Ghi nhận khách walk-in' : 'Khách xác nhận'}
            </CardTitle>
            <CardDescription>
              {isWalkIn
                ? 'Khách vãng lai không có tài khoản — staff ghi nhận phản hồi trực tiếp tại quầy.'
                : 'Khách có tài khoản tự xác nhận trên app. Staff chỉ ghi nhận thay khi được ủy quyền.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canWalkInAccept ? (
              <>
                <p className="text-sm text-slate-600">
                  Sau khi khách walk-in đã kiểm tra tình trạng xe và đồng ý,
                  bấm nút bên dưới để ghi nhận phản hồi.
                </p>
                <div>
                  <label
                    htmlFor="walk-in-note"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Ghi chú (tùy chọn)
                  </label>
                  <Textarea
                    id="walk-in-note"
                    rows={3}
                    value={walkInNote}
                    onChange={(event) => setWalkInNote(event.target.value)}
                    placeholder="VD: Khách đã kiểm tra, không có vấn đề gì."
                    disabled={isProcessing}
                  />
                </div>
                <Button
                  onClick={() => void handleWalkInAccept()}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {walkInAcceptMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Khách walk-in đồng ý tình trạng xe
                </Button>
              </>
            ) : !handover ? (
              <p className="text-sm text-slate-500">
                Chưa có handover — hãy chuẩn bị bàn giao trước.
              </p>
            ) : handover.state === 'PENDING' ? (
              <p className="text-sm text-slate-500">
                Handover chưa ở trạng thái sẵn sàng.
              </p>
            ) : handover.customer_response === 'PENDING' && !isWalkIn ? (
              <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-medium">Đang chờ khách xác nhận</p>
                <p className="mt-1">
                  Khách sẽ nhận thông báo trên app và tự xác nhận tình trạng
                  xe. Trang này tự làm mới mỗi 5 giây.
                </p>
                {handover.customer_responded_at ? (
                  <p className="mt-2 text-xs text-amber-800">
                    Phản hồi gần nhất:{' '}
                    {formatDateTime(handover.customer_responded_at)}
                  </p>
                ) : null}
              </div>
            ) : handover.customer_response === 'ISSUE_REPORTED' ? (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-900">
                <p className="font-medium">Khách đã báo cáo vấn đề</p>
                <p className="mt-1">
                  Handover đang <b>ON_HOLD</b>. Staff xử lý qua{' '}
                  <Link
                    to="/staff/customer-cases"
                    className="underline hover:text-red-700"
                  >
                    hồ sơ khiếu nại
                  </Link>
                  . Sau khi case <b>RESOLVED</b>, khách sẽ xác nhận lại tại đây.
                </p>
                {handover.issue_case_ids?.length ? (
                  <p className="mt-2 text-xs">
                    Case liên quan: {handover.issue_case_ids.join(', ')}
                  </p>
                ) : null}
              </div>
            ) : handover.customer_response === 'ACCEPTED' ? (
              <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                <p className="font-medium">Khách đã đồng ý tình trạng xe</p>
                {handover.accepted_at ? (
                  <p className="mt-1 text-xs">
                    Thời điểm: {formatDateTime(handover.accepted_at)}
                  </p>
                ) : null}
              </div>
            ) : handover.state === 'RELEASED' ? (
              <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                <p className="font-medium">Đã bàn giao xe</p>
                {handover.released_at ? (
                  <p className="mt-1 text-xs">
                    Thời điểm: {formatDateTime(handover.released_at)}
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
          Bước 5: Thanh toán (chỉ hiện khi khách đã đồng ý)
          ============================================================ */}
      {canShowPayment || handoverReleased || paymentSettled ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Thanh toán</CardTitle>
            <CardDescription>
              Thu tiền mặt hoặc tạo QR PayOS. Chỉ thanh toán khi khách đã đồng
              ý tình trạng xe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-600">Số tiền:</span>
              <span className="text-lg font-semibold text-slate-900">
                {formatVnd(booking.final_price)}
              </span>
              <Badge
                variant={
                  booking.payment_status === 'WAIVED'
                    ? 'info'
                    : booking.payment_status === 'PAID'
                      ? 'success'
                      : booking.payment_status === 'PENDING'
                        ? 'warning'
                        : 'default'
                }
              >
                {booking.payment_status === 'WAIVED'
                  ? 'Đã miễn'
                  : booking.payment_status === 'PAID'
                    ? 'Đã thanh toán'
                    : booking.payment_status === 'PENDING'
                      ? 'Đang chờ PayOS'
                      : 'Chưa thanh toán'}
              </Badge>
              {booking.payment_method ? (
                <Badge variant="default">
                  {booking.payment_method === 'CASH' ? 'Tiền mặt' : 'PayOS'}
                </Badge>
              ) : null}
            </div>

            {handoverReleased ? (
              <p className="text-sm text-slate-500">
                Booking đã được bàn giao — không thể thay đổi thanh toán tại
                đây.
              </p>
            ) : paymentSettled ? (
              <p className="text-sm text-emerald-700">
                Thanh toán đã hoàn tất — có thể bàn giao xe.
              </p>
            ) : booking.payment_status === 'PENDING' ? (
              <p className="text-sm text-amber-700">
                Đã tạo link PayOS — chờ khách quét QR. Nếu khách walk-in muốn
                đổi sang tiền mặt, vẫn có thể bấm "Thu tiền mặt" bên dưới (BE
                sẽ huỷ giao dịch PayOS đang pending).
              </p>
            ) : null}

            {canShowPayment ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  onClick={() => void handleCollectCash()}
                  disabled={!canCollectCash || isProcessing}
                >
                  {markBookingPaid.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Banknote className="h-4 w-4" />
                  )}
                  Thu tiền mặt
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void handleCreatePayos()}
                  disabled={!canCreatePayos || isProcessing}
                >
                  {createPayosPayment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Tạo QR PayOS
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* ============================================================
          Bước 6: Bàn giao xe
          ============================================================ */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Bàn giao xe</CardTitle>
          <CardDescription>
            Chỉ bấm khi khách đã đồng ý tình trạng xe VÀ đã thanh toán (hoặc
            được miễn hợp lệ).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {handoverReleased ? (
            <p className="text-sm text-slate-500">
              Booking đã được bàn giao.
            </p>
          ) : !canRelease ? (
            <p className="text-sm text-amber-800">
              Cần: (1) khách đã đồng ý tình trạng xe, (2) thanh toán PAID hoặc
              được miễn hợp lệ. Dùng card "Thanh toán" phía trên để thu tiền
              trước.
            </p>
          ) : null}
          <Button
            onClick={() => void handleRelease()}
            disabled={!canRelease || isProcessing}
            className="w-full"
          >
            {releaseMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {handoverReleased ? 'Đã bàn giao xe' : 'Bàn giao xe'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
