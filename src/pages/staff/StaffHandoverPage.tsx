import { ArrowLeft, CheckCircle2, Loader2, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../api/client'
import {
  HANDOVER_STATUS_LABELS,
  HANDOVER_STATUS_VARIANT,
} from '../../api/handover.api'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../contexts/ToastContext'
import {
  useReadyBookingHandoverMutation,
  useReleaseBookingHandoverMutation,
  useStaffBookingHandover,
} from '../../hooks/api/staff/useStaffHandover'
import { useStaffBookingDetail } from '../../hooks/api/staff/useStaffBookingDetail'
import { formatDateTime } from '../../utils/format'

export function StaffHandoverPage() {
  const { bookingId } = useParams()
  const { showToast } = useToast()
  const [staffNotes, setStaffNotes] = useState('')
  const [disputeNote, setDisputeNote] = useState('')

  const detailQuery = useStaffBookingDetail(bookingId)
  const handoverQuery = useStaffBookingHandover(bookingId)

  const readyMutation = useReadyBookingHandoverMutation(bookingId ?? '')
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
  const handover = handoverQuery.data

  const status = handover?.status ?? 'NOT_STARTED'
  const statusLabel = HANDOVER_STATUS_LABELS[status] ?? status
  const statusVariant = HANDOVER_STATUS_VARIANT[status] ?? 'default'

  const handleReady = async () => {
    try {
      await readyMutation.mutateAsync({
        staff_notes: staffNotes.trim() || undefined,
      })
      showToast('Đã chuẩn bị bàn giao — chờ khách xác nhận.', 'success')
      setStaffNotes('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể chuẩn bị bàn giao.'), 'error')
    }
  }

  const handleRelease = async (response: 'ACCEPTED' | 'DISPUTED') => {
    try {
      await releaseMutation.mutateAsync({
        customer_response: response,
        note: response === 'DISPUTED' ? disputeNote.trim() || undefined : undefined,
      })
      showToast(
        response === 'ACCEPTED'
          ? 'Khách đã nhận xe. Booking hoàn tất.'
          : 'Đã ghi nhận tranh chấp từ khách.',
        response === 'ACCEPTED' ? 'success' : 'warning',
      )
      setDisputeNote('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể ghi nhận phản hồi.'), 'error')
    }
  }

  const canReady = status === 'NOT_STARTED' && booking.status === 'COMPLETED'
  const canRelease =
    status === 'AWAITING_CUSTOMER_RESPONSE' || status === 'READY_FOR_HANDOVER'
  const isProcessing = readyMutation.isPending || releaseMutation.isPending

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
        description="Chuẩn bị bàn giao xe cho khách và ghi nhận xác nhận nhận xe."
        action={
          <Badge variant={statusVariant as never} className="text-sm">
            {statusLabel}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-5 w-5 text-slate-500" />
              Chuẩn bị bàn giao
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Sau khi hoàn tất dịch vụ và thanh toán, nhấn nút bên dưới để thông báo
              cho khách hàng rằng xe đã sẵn sàng nhận.
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
              {status === 'NOT_STARTED' ? 'Chuẩn bị bàn giao' : 'Đã gửi yêu cầu'}
            </Button>
            {handover?.ready_at ? (
              <p className="text-xs text-slate-500">
                Đã gửi lúc {formatDateTime(handover.ready_at)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ghi nhận phản hồi khách</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Khi khách đến quầy, nhấn một trong hai nút để ghi nhận kết quả bàn giao.
              Nếu khách từ chối nhận xe (vd: còn vết bẩn), hãy nhập lý do.
            </p>

            <div>
              <label
                htmlFor="dispute-note"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Lý do khách từ chối (nếu có)
              </label>
              <Textarea
                id="dispute-note"
                rows={3}
                value={disputeNote}
                onChange={(event) => setDisputeNote(event.target.value)}
                placeholder="VD: Khách phát hiện vết xước mới ở cản sau…"
                disabled={!canRelease || isProcessing}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => void handleRelease('DISPUTED')}
                disabled={!canRelease || isProcessing}
              >
                {releaseMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Từ chối nhận
              </Button>
              <Button
                onClick={() => void handleRelease('ACCEPTED')}
                disabled={!canRelease || isProcessing}
              >
                {releaseMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Khách đã nhận xe
              </Button>
            </div>

            {handover?.released_at ? (
              <p className="text-xs text-slate-500">
                Ghi nhận lúc {formatDateTime(handover.released_at)}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {handoderEvents(handover).length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Lịch sử bàn giao</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {handover!.events.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap items-start gap-3 border-l-2 border-brand-200 pl-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{event.type}</p>
                    {event.note ? (
                      <p className="text-sm text-slate-600">{event.note}</p>
                    ) : null}
                  </div>
                  <span className="text-xs text-slate-500">
                    {event.created_at ? formatDateTime(event.created_at) : ''}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function handoderEvents(
  handover: { events?: unknown[] } | null | undefined,
): Array<{ id: string; type: string; note: string | null; created_at?: string }> {
  const events = handover?.events
  if (!Array.isArray(events)) return []
  return events.map((raw) => {
    const event = raw as { id?: string; type?: string; note?: string; created_at?: string }
    return {
      id: event.id ?? '',
      type: event.type ?? '',
      note: event.note ?? null,
      created_at: event.created_at,
    }
  })
}