import { ArrowLeft, Car, CheckCircle2, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../api/client'
import {
  PLATE_SCAN_STATUS_LABELS,
  PLATE_SCAN_STATUS_VARIANT,
} from '../../api/plateScan.api'
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
import { Label } from '../../components/ui/Label'
import { useToast } from '../../contexts/ToastContext'
import {
  useConfirmPlateScanMutation,
  useRejectPlateScanMutation,
  useRequestAlternateVehicleMutation,
  useRetryPlateScanMutation,
  useStaffPlateScanDetail,
} from '../../hooks/api/staff/useStaffPlateScans'
import type { ApiPlateScanCandidate } from '../../types/api/plateScan'
import { formatDateTime } from '../../utils/format'

export function StaffPlateScanDetailPage() {
  const { scanId } = useParams()
  const { showToast } = useToast()

  const detailQuery = useStaffPlateScanDetail(scanId)
  const confirmMutation = useConfirmPlateScanMutation(scanId ?? '')
  const rejectMutation = useRejectPlateScanMutation(scanId ?? '')
  const alternateMutation = useRequestAlternateVehicleMutation(scanId ?? '')
  const retryMutation = useRetryPlateScanMutation(scanId ?? '')

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [alternateVehicleId, setAlternateVehicleId] = useState('')
  const [alternateReason, setAlternateReason] = useState('')
  const [retryFrameUrls, setRetryFrameUrls] = useState('')

  if (detailQuery.isLoading) return <DashboardPageSkeleton />
  if (!detailQuery.data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Không tìm thấy lượt quét
        </h1>
        <Link to="/staff/arrivals" className="mt-4">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </Link>
      </div>
    )
  }

  const scan = detailQuery.data
  const candidates: ApiPlateScanCandidate[] = scan.candidates ?? []
  const frames = scan.frames ?? []
  const status = scan.status
  const statusLabel = PLATE_SCAN_STATUS_LABELS[status] ?? status
  const statusVariant = PLATE_SCAN_STATUS_VARIANT[status] ?? 'default'

  const isMutating =
    confirmMutation.isPending ||
    rejectMutation.isPending ||
    alternateMutation.isPending ||
    retryMutation.isPending

  const handleConfirm = async () => {
    if (!selectedCandidateId) {
      showToast('Vui lòng chọn 1 candidate để xác nhận.', 'error')
      return
    }
    const candidate = candidates.find((c) => c.id === selectedCandidateId)
    if (!candidate) return
    try {
      await confirmMutation.mutateAsync({
        booking_id: candidate.booking_id,
        candidate_id: selectedCandidateId,
      })
      showToast('Đã xác nhận check-in cho booking.', 'success')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể xác nhận.'), 'error')
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối.', 'error')
      return
    }
    try {
      await rejectMutation.mutateAsync({ reason: rejectReason.trim() })
      showToast('Đã từ chối lượt quét.', 'success')
      setRejectReason('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể từ chối.'), 'error')
    }
  }

  const handleAlternate = async () => {
    if (!alternateVehicleId.trim() || !alternateReason.trim()) {
      showToast('Vui lòng nhập ID xe thay thế và lý do.', 'error')
      return
    }
    try {
      await alternateMutation.mutateAsync({
        vehicle_id: alternateVehicleId.trim(),
        reason: alternateReason.trim(),
      })
      showToast('Đã gửi yêu cầu dùng xe thay thế — chờ admin duyệt.', 'success')
      setAlternateVehicleId('')
      setAlternateReason('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể yêu cầu xe thay thế.'), 'error')
    }
  }

  const handleRetry = async () => {
    const urls = retryFrameUrls
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    if (urls.length === 0) {
      showToast('Vui lòng nhập URL frame để retry.', 'error')
      return
    }
    try {
      await retryMutation.mutateAsync({ frame_upload_ids: urls })
      showToast('Đã gửi retry. Vui lòng đợi BE xử lý.', 'success')
      setRetryFrameUrls('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể retry.'), 'error')
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/staff/arrivals"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại hàng chờ
        </Link>
      </div>

      <PageHeader
        eyebrow="Carivo Staff"
        title={`Lượt quét biển số · ${scan.detected_plate ?? '?'}`}
        description={
          scan.captured_at ? `Chụp lúc ${formatDateTime(scan.captured_at)}` : undefined
        }
        action={<Badge variant={statusVariant}>{statusLabel}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-5 w-5 text-slate-500" />
              Ảnh chụp & frame
            </CardTitle>
          </CardHeader>
          <CardContent>
            {frames.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có frame nào.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {frames.map((frame) => (
                  <a
                    key={frame.id}
                    href={frame.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-xl border border-slate-200"
                  >
                    <img
                      src={frame.url}
                      alt="frame"
                      className="h-32 w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking ứng viên</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {candidates.length === 0 ? (
              <p className="text-sm text-slate-500">BE chưa tìm được booking nào khớp.</p>
            ) : (
              candidates.map((candidate) => (
                <label
                  key={candidate.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <input
                    type="radio"
                    name="candidate"
                    className="mt-1"
                    checked={selectedCandidateId === candidate.id}
                    onChange={() => setSelectedCandidateId(candidate.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono font-bold text-slate-900">
                        {candidate.expected_plate ?? candidate.detected_plate ?? '—'}
                      </p>
                      <Badge variant="info">
                        {Math.round(candidate.confidence * 100)}% khớp
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700">
                      {candidate.customer_name ?? '—'} · {candidate.vehicle_label ?? '—'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Booking {candidate.booking_code ?? candidate.booking_id} ·{' '}
                      {candidate.scheduled_start_time
                        ? formatDateTime(candidate.scheduled_start_time)
                        : ''}
                    </p>
                  </div>
                </label>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Hành động</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleConfirm} disabled={isMutating}>
                {confirmMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Xác nhận check-in
              </Button>
              <Button variant="danger" onClick={handleReject} disabled={isMutating}>
                {rejectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Từ chối
              </Button>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 space-y-2">
              <p className="text-sm font-medium text-slate-700">Từ chối — lý do</p>
              <textarea
                rows={2}
                className="min-h-[60px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                placeholder="VD: Biển số không khớp booking nào"
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
              />
            </div>

            <div className="rounded-xl border border-slate-200 p-3 space-y-2">
              <p className="text-sm font-medium text-slate-700">Yêu cầu dùng xe thay thế</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label htmlFor="alt-vehicle">ID xe thay thế</Label>
                  <input
                    id="alt-vehicle"
                    className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    value={alternateVehicleId}
                    onChange={(event) => setAlternateVehicleId(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="alt-reason">Lý do</Label>
                  <input
                    id="alt-reason"
                    className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    value={alternateReason}
                    onChange={(event) => setAlternateReason(event.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleAlternate} disabled={isMutating} variant="secondary">
                {alternateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Gửi yêu cầu
              </Button>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 space-y-2">
              <p className="text-sm font-medium text-slate-700">Retry với frame mới</p>
              <textarea
                rows={3}
                className="min-h-[80px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                placeholder="Mỗi dòng một URL frame mới"
                value={retryFrameUrls}
                onChange={(event) => setRetryFrameUrls(event.target.value)}
              />
              <Button onClick={handleRetry} disabled={isMutating} variant="secondary">
                {retryMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Retry nhận diện
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}