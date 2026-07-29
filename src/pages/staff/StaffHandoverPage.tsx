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
import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorCode, getApiErrorMessage } from '../../api/client'
import axios from 'axios'
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

/**
 * Nhận diện lỗi idempotent "state đã được ghi nhận trước đó" cho cả 3 handler
 * ready/walk-in/release. Race pattern giống nhau: lần submit 1 thành công → BE
 * đã đổi state + save DB → invalidate TanStack Query cache → nhưng trong cùng
 * frame lần 2 vẫn qua được state-based guard (cache chưa kịp refetch), vào BE
 * một lần nữa → BE trả 400/409. UI đã cập nhật (state-based guard đúng cho
 * lần 3 trở đi) → ta nuốt lỗi lần 2 thay vì hiện toast đỏ gây hiểu nhầm.
 *
 * Match theo cả 3 tầng để robust với BE thay đổi error_code:
 *  1. error_code khớp danh sách đã biết (fallback nếu BE có code mới thì patch sau).
 *  2. HTTP 409 Conflict (chuẩn REST cho idempotency violation).
 *  3. Message BE chứa keyword "already" / "duplicate" / "exists" (heuristic
 *     cuối cùng cho BE dùng message thay error_code, vd Prisma unique violation).
 *
 * Pattern sync với `isStaleAssignmentError` ở ServiceItemList / ServiceWorkflowTab.
 */
function getApiErrorStatus(error: unknown): number | undefined {
  if (!axios.isAxiosError(error)) return undefined
  return error.response?.status
}

function getApiErrorMessageText(error: unknown): string {
  const data = (axios.isAxiosError(error) ? error.response?.data : undefined) as
    | { message?: string; error_code?: string }
    | undefined
  return data?.message ?? ''
}

function matchesIdempotentPattern(error: unknown, knownCodes: readonly string[]): boolean {
  const code = getApiErrorCode(error)
  if (code && knownCodes.includes(code)) return true
  const status = getApiErrorStatus(error)
  if (status === 409) return true
  const text = `${getApiErrorMessageText(error)} ${code ?? ''}`.toLowerCase()
  return /already|duplicate|exists|đã (được|tồn tại)|trùng/.test(text)
}

function isStaleReadyError(error: unknown): boolean {
  // handleReady race: 500 "duplicate key" / 409 "handover already exists" /
  // Prisma P2002 unique violation khi tạo BookingHandover 2 lần.
  return matchesIdempotentPattern(error, [
    'BOOKING_HANDOVER_ALREADY_EXISTS',
    'BOOKING_HANDOVER_ALREADY_READY',
    'DUPLICATE_KEY',
    'UNIQUE_VIOLATION',
  ])
}

function isStaleWalkInError(error: unknown): boolean {
  return matchesIdempotentPattern(error, [
    'WALK_IN_ALREADY_RECORDED',
    'BOOKING_HANDOVER_WALK_IN_ALREADY_ACCEPTED',
    'BOOKING_HANDOVER_CUSTOMER_RESPONSE_INVALID',
  ])
}

function isStaleReleaseError(error: unknown): boolean {
  return matchesIdempotentPattern(error, [
    'BOOKING_HANDOVER_ALREADY_RELEASED',
    'BOOKING_HANDOVER_STATE_INVALID',
  ])
}

export function StaffHandoverPage() {
  const { bookingId } = useParams()
  const { showToast } = useToast()
  const [staffNotes, setStaffNotes] = useState('')
  const [walkInNote, setWalkInNote] = useState('')
  const [paymentAction, setPaymentAction] = useState<'cash' | 'payos' | null>(null)
  // Ref chống double-submit cho handleWalkInAccept (mutation.isPending reset
  // ngay khi server trả về nên không đủ dùng làm guard trong cùng frame).
  const walkInSubmittingRef = useRef(false)
  const releaseSubmittingRef = useRef(false)
  // Ref chống double-submit cho handleReady. `readyMutation.isPending` flip
  // về false ngay khi server trả về (trước khi code phía sau await chạy tiếp),
  // `handover.state === 'READY_FOR_CUSTOMER'` thì cache TanStack Query chưa
  // kịp refetch trong cùng frame → 1 trong 2 guard có thể bị trượt và fire
  // mutate lần 2 → BE BookingHandover.create duplicate-key 500 → toast đỏ
  // "Không thể chuẩn bị bàn giao." đè lên success toast của lần 1.
  const readySubmittingRef = useRef(false)

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
    canShowPayment &&
    (booking.payment_status === 'UNPAID' ||
      booking.payment_status === 'PENDING')
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
    paymentAction !== null

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleReady = async () => {
    // Guard chống double-submit bằng ref + state-based (đồng bộ với
    // handleWalkInAccept / handleRelease). mut.isPending có thể reset ngay
    // khi server trả về và handover.state thì cache chưa kịp refetch trong
    // cùng frame → lần 2 có thể trượt qua guard cũ → BE BookingHandover
    // duplicate-key 500 → toast đỏ đè lên success toast.
    if (
      readySubmittingRef.current ||
      readyMutation.isPending ||
      handover?.state === 'READY_FOR_CUSTOMER'
    ) {
      return
    }
    readySubmittingRef.current = true
    try {
      await readyMutation.mutateAsync({ note: staffNotes.trim() || undefined })
      showToast('Hoàn thành đã chuẩn bị bàn giao.', 'success')
      setStaffNotes('')
    } catch (error) {
      // Nuốt lỗi idempotent (race sau success) — UI đã đổi sang
      // READY_FOR_CUSTOMER, không cần báo staff, sẽ gây hiểu nhầm
      // "thành công mà vẫn báo lỗi".
      if (isStaleReadyError(error)) return
      showToast(
        getApiErrorMessage(error, 'Không thể chuẩn bị bàn giao.'),
        'error',
      )
    } finally {
      readySubmittingRef.current = false
    }
  }

  const handleWalkInAccept = async () => {
    // 3 lớp guard: ref (đồng bộ trong frame) + mut.isPending (khi BE chưa trả)
    // + state-based (sau khi cache đồng bộ xong). Thiếu lớp nào race cũng
    // lọt → BE trả lỗi idempotent 400/409 → toast đỏ đè lên success toast.
    if (
      walkInSubmittingRef.current ||
      walkInAcceptMutation.isPending ||
      handover?.customer_response === 'ACCEPTED'
    ) {
      return
    }
    walkInSubmittingRef.current = true
    try {
      await walkInAcceptMutation.mutateAsync({
        note: walkInNote.trim() || undefined,
      })
      showToast('Đã ghi nhận khách đồng ý tình trạng xe.', 'success')
      setWalkInNote('')
    } catch (error) {
      // Nuốt lỗi idempotent (race sau success) — UI đã cập nhật → không
      // cần báo staff, sẽ gây hiểu nhầm "thành công mà vẫn báo lỗi".
      if (isStaleWalkInError(error)) return
      showToast(
        getApiErrorMessage(
          error,
          'Không thể ghi nhận khách đồng ý tình trạng xe.',
        ),
        'error',
      )
    } finally {
      walkInSubmittingRef.current = false
    }
  }

  const handleCollectCash = async () => {
    if (!bookingId) return
    if (
      booking.payment_status === 'PENDING' &&
      !window.confirm(
        'Booking đang có QR PayOS chờ thanh toán. Tiếp tục sẽ hủy QR hiện tại và xác nhận đã thu đủ tiền mặt.',
      )
    ) {
      return
    }
    setPaymentAction('cash')
    try {
      const result = await markBookingPaid(bookingId)
      if (result.success) {
        showToast(result.message, 'success')
        await detailQuery.refetch()
      } else {
        showToast(result.message, 'error')
      }
    } finally {
      setPaymentAction(null)
    }
  }

  const handleCreatePayos = async () => {
    if (!bookingId) return
    setPaymentAction('payos')
    try {
      const result = await createPayosPayment(bookingId)
      if (result.success && result.checkoutUrl) {
        window.open(result.checkoutUrl, '_blank', 'noopener,noreferrer')
        showToast(
          'Đã tạo link PayOS — đưa khách quét QR trên cửa sổ mới.',
          'success',
        )
        await detailQuery.refetch()
      } else if (!result.success) {
        showToast(result.message, 'error')
      }
    } finally {
      setPaymentAction(null)
    }
  }

  const handleRelease = async () => {
    // Guard chống double-submit bằng ref + state-based (đồng bộ với
    // handleReady / handleWalkInAccept). mut.isPending có thể reset ngay khi
    // server trả về → lần 2 trong cùng frame có thể trượt qua guard cũ và
    // sinh toast error "Không thể bàn giao xe" đè lên success toast.
    if (
      releaseSubmittingRef.current ||
      releaseMutation.isPending ||
      handoverReleased
    ) {
      return
    }
    releaseSubmittingRef.current = true
    try {
      await releaseMutation.mutateAsync({})
      showToast('Đã bàn giao xe thành công.', 'success')
    } catch (error) {
      // Nuốt lỗi idempotent (race sau success) — UI đã đổi sang RELEASED,
      // không cần báo staff, sẽ gây hiểu nhầm "thành công mà vẫn báo lỗi".
      if (isStaleReleaseError(error)) return
      showToast(getApiErrorMessage(error, 'Không thể bàn giao xe.'), 'error')
    } finally {
      releaseSubmittingRef.current = false
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
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
              <div className="carivo-fade-in flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="font-medium">Hoàn thành chuẩn bị bàn giao</p>
                  <p className="mt-0.5 text-xs text-emerald-700">
                    Đã gửi lúc {formatDateTime(handover.ready_at)}
                  </p>
                </div>
              </div>
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
              <div className="carivo-fade-in rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <p className="font-medium">Khách đã walk-in thành công</p>
                    {handover.accepted_at ? (
                      <p className="mt-1 text-xs text-emerald-700">
                        Thời điểm: {formatDateTime(handover.accepted_at)}
                      </p>
                    ) : null}
                    {handover.customer_response_note ? (
                      <p className="mt-1 text-xs italic text-emerald-700">
                        Ghi chú: {handover.customer_response_note}
                      </p>
                    ) : null}
                  </div>
                </div>
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
                đổi sang tiền mặt, vẫn có thể bấm "Hủy QR và thu tiền mặt" bên dưới (BE
                sẽ huỷ giao dịch PayOS đang pending).
              </p>
            ) : null}

            {canShowPayment ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  onClick={() => void handleCollectCash()}
                  disabled={!canCollectCash || isProcessing}
                >
                  {paymentAction === 'cash' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Banknote className="h-4 w-4" />
                  )}
                  {booking.payment_status === 'PENDING'
                    ? 'Hủy QR và thu tiền mặt'
                    : 'Thu tiền mặt'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void handleCreatePayos()}
                  disabled={!canCreatePayos || isProcessing}
                >
                  {paymentAction === 'payos' ? (
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
            <div className="carivo-fade-in rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="font-medium">Đã hoàn thành bàn giao xe</p>
                  {handover.released_at ? (
                    <p className="mt-1 text-xs text-emerald-700">
                      Thời điểm: {formatDateTime(handover.released_at)}
                    </p>
                  ) : null}
                  {handover.release_note ? (
                    <p className="mt-1 text-xs italic text-emerald-700">
                      Ghi chú: {handover.release_note}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
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
