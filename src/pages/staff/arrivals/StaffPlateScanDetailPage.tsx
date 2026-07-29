// ============================================================================
// Staff Plate Scan Detail — Phase 2.11.
//
// Phase 1: rewrite theo canonical types.
// Phase 2.11: extract forms thành Modal components + candidate list.
//   - Confirm: opens ConfirmOverrideModal khi candidate.match_type !== 'EXACT'
//     (BE sẽ reject nếu không có override_reason)
//   - Reject: opens RejectScanModal
//   - Alternate: opens AlternateVehicleModal
//   - Retry: file upload inline (lightweight)
// ============================================================================

import {
  AlertTriangle,
  ArrowLeft,
  Car,
  CheckCircle2,
  Crop,
  Hash,
  Loader2,
  RefreshCcw,
  ScanLine,
  ShieldAlert,
  Truck,
  Upload,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getApiErrorMessage } from '../../../api/client'
import { uploadFileApi } from '../../../api/upload.api'
import {
  ALTERNATE_VEHICLE_STATUS_LABELS,
} from '../../../api/plateScan.api'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import {
  AlternateVehicleModal,
} from '../../../components/staff/plate-scan/AlternateVehicleModal'
import {
  CameraCapturePanel,
} from '../../../components/staff/plate-scan/CameraCapturePanel'
import {
  ConfirmOverrideModal,
} from '../../../components/staff/plate-scan/ConfirmOverrideModal'
import {
  PlateScanCandidateList,
} from '../../../components/staff/plate-scan/PlateScanCandidateList'
import {
  PlateScanExpiryCountdown,
} from '../../../components/staff/plate-scan/PlateScanExpiryCountdown'
import { PlateScanStatusBadge } from '../../../components/staff/plate-scan/PlateScanStatusBadge'
import {
  RejectScanModal,
} from '../../../components/staff/plate-scan/RejectScanModal'
import {
  useConfirmPlateScanMutation,
  useRejectPlateScanMutation,
  useRequestAlternateVehicleMutation,
  useRetryPlateScanMutation,
  useStaffPlateScanDetail,
} from '../../../hooks/api/staff/useStaffPlateScans'
import type {
  ApiConfirmPlateScanPayload,
  ApiPlateScanCandidate,
  ApiPlateScanFrame,
  ApiRejectPlateScanPayload,
  ApiRequestAlternateVehiclePayload,
  ApiRetryPlateScanPayload,
} from '../../../types/api/plateScan'
import { formatDateTime } from '../../../utils/format'

export function StaffPlateScanDetailPage() {
  const { scanId } = useParams()
  const { showToast } = useToast()

  const detailQuery = useStaffPlateScanDetail(scanId)
  const confirmMutation = useConfirmPlateScanMutation(scanId ?? '')
  const rejectMutation = useRejectPlateScanMutation(scanId ?? '')
  const alternateMutation = useRequestAlternateVehicleMutation(scanId ?? '')
  const retryMutation = useRetryPlateScanMutation(scanId ?? '')

  // ----- Local state -----------------------------------------------------
  const [selectedCandidateId, setSelectedCandidateId] = useState<
    string | null
  >(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [alternateModalOpen, setAlternateModalOpen] = useState(false)
  const [retryFiles, setRetryFiles] = useState<File[]>([])
  const [retryIsUploading, setRetryIsUploading] = useState(false)
  const candidates: ApiPlateScanCandidate[] = useMemo(
    () => detailQuery.data?.candidates ?? [],
    [detailQuery.data?.candidates],
  )
  const selectedCandidate = useMemo(
    () =>
      candidates.find((candidate) => candidate.booking_id === selectedCandidateId) ??
      null,
    [candidates, selectedCandidateId],
  )

  if (detailQuery.isLoading) return <DashboardPageSkeleton />

  if (!detailQuery.data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Không tìm thấy lượt quét
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Lượt quét có thể đã bị expire hoặc bạn không có quyền truy cập.
        </p>
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
  const frames: ApiPlateScanFrame[] = scan.frame_results ?? []
  const status = scan.status

  const isMutating =
    confirmMutation.isPending ||
    rejectMutation.isPending ||
    alternateMutation.isPending ||
    retryMutation.isPending

  const isTerminal =
    status === 'CONFIRMED' ||
    status === 'REJECTED' ||
    status === 'EXPIRED' ||
    status === 'FAILED'

  const requiresOverride =
    selectedCandidate !== null && selectedCandidate.match_type !== 'EXACT'

  // ----- Handlers --------------------------------------------------------

  const handleOpenConfirm = () => {
    if (!selectedCandidateId) {
      showToast('Vui lòng chọn 1 booking để xác nhận.', 'error')
      return
    }
    if (requiresOverride) {
      setConfirmModalOpen(true)
      return
    }
    void runExactConfirm()
  }

  const runExactConfirm = async () => {
    if (!selectedCandidate) return
    try {
      const payload: ApiConfirmPlateScanPayload = {
        booking_id: selectedCandidate.booking_id,
      }
      await confirmMutation.mutateAsync(payload)
      showToast('Đã xác nhận check-in cho booking.', 'success')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể xác nhận.'), 'error')
    }
  }

  const handleOverrideConfirm = async (params: {
    booking_id: string
    override_reason: string
  }) => {
    try {
      const payload: ApiConfirmPlateScanPayload = {
        booking_id: params.booking_id,
        override_reason: params.override_reason,
      }
      await confirmMutation.mutateAsync(payload)
      showToast('Đã xác nhận check-in (override).', 'success')
      setConfirmModalOpen(false)
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể xác nhận.'), 'error')
    }
  }

  const handleReject = async (payload: ApiRejectPlateScanPayload) => {
    try {
      await rejectMutation.mutateAsync(payload)
      showToast('Đã từ chối lượt quét.', 'success')
      setRejectModalOpen(false)
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể từ chối.'), 'error')
    }
  }

  const handleAlternate = async (
    payload: ApiRequestAlternateVehiclePayload,
  ) => {
    try {
      await alternateMutation.mutateAsync(payload)
      showToast(
        'Đã gửi yêu cầu dùng xe thay thế — chờ admin duyệt.',
        'success',
      )
      setAlternateModalOpen(false)
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể yêu cầu xe thay thế.'),
        'error',
      )
    }
  }

  const handleRetryFiles = (files: File[]) => {
    setRetryFiles(files.slice(0, 5))
  }

  const handleRetrySubmit = async () => {
    if (retryFiles.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 ảnh để retry.', 'error')
      return
    }
    setRetryIsUploading(true)
    try {
      const uploadIds: string[] = []
      for (const file of retryFiles) {
        const upload = await uploadFileApi(file, {
          purpose: 'BOOKING_PLATE_SCAN',
        })
        uploadIds.push(upload.id)
      }
      const payload: ApiRetryPlateScanPayload = {
        upload_ids: uploadIds,
        mode: uploadIds.length > 1 ? 'LIVE_BATCH' : 'SINGLE',
        capture_source: uploadIds.length > 1 ? 'LIVE_CAMERA' : 'STAFF_CAMERA',
      }
      await retryMutation.mutateAsync(payload)
      showToast('Đã gửi retry. Vui lòng đợi BE xử lý.', 'success')
      setRetryFiles([])
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể retry.'), 'error')
    } finally {
      setRetryIsUploading(false)
    }
  }

  const handleRemoveRetryFile = (index: number) => {
    setRetryFiles((current) => current.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/staff/arrivals"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại hàng chờ
        </Link>
        {scan.expires_at && !isTerminal ? (
          <PlateScanExpiryCountdown expiresAt={scan.expires_at} />
        ) : null}
      </div>

      <PageHeader
        eyebrow="Carivo Staff"
        title={`Lượt quét · ${
          scan.normalized_plate ?? scan.raw_plate_text ?? '—'
        }`}
        description={
          scan.captured_at
            ? `Chụp lúc ${formatDateTime(scan.captured_at)} · ${scan.mode} · ${scan.capture_source}`
            : `${scan.mode ?? ''}`
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            {scan.manual_override ? (
              <Badge variant="warning">
                <ShieldAlert className="mr-1 h-3 w-3" />
                Manual override
              </Badge>
            ) : null}
            <PlateScanStatusBadge status={status} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ----- Frame results ----- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-5 w-5 text-slate-500" />
              Ảnh chụp & frame ({frames.length})
            </CardTitle>
            {scan.plate_crop_url ? (
              <CardDescription>
                <a
                  href={scan.plate_crop_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                >
                  <Crop className="h-3 w-3" />
                  Xem crop biển số (BE detect)
                </a>
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent>
            {frames.length === 0 ? (
              <p className="text-sm text-slate-500">
                Chưa có frame nào (BE có thể đã purge ảnh sau 7 ngày).
              </p>
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
                    {frame.width && frame.height ? (
                      <p className="px-2 py-1 text-[10px] text-slate-500">
                        {frame.width}×{frame.height}
                      </p>
                    ) : null}
                  </a>
                ))}
              </div>
            )}

            {scan.quality_flags.length > 0 ? (
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  Quality flags ({scan.quality_flags.length})
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {scan.quality_flags.map((flag) => (
                    <li
                      key={flag}
                      className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                    >
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* ----- Candidates ----- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanLine className="h-5 w-5 text-slate-500" />
              Booking ứng viên ({candidates.length})
            </CardTitle>
            <CardDescription>
              Chọn 1 booking để xác nhận. Fuzzy / Manual bắt buộc có override
              reason (lý do).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlateScanCandidateList
              candidates={candidates}
              selectedBookingId={selectedCandidateId}
              onSelect={setSelectedCandidateId}
              disabled={isMutating || isTerminal}
            />
          </CardContent>
        </Card>

        {/* ----- Actions ----- */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Hành động</CardTitle>
            <CardDescription>
              Sau khi chọn booking, bấm "Xác nhận check-in". Nếu biển số không
              khớp chính xác, hệ thống sẽ yêu cầu nhập lý do override.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleOpenConfirm}
                disabled={
                  isMutating || isTerminal || candidates.length === 0
                }
              >
                {confirmMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Xác nhận check-in
              </Button>
              <Button
                variant="danger"
                onClick={() => setRejectModalOpen(true)}
                disabled={isMutating || isTerminal}
              >
                <X className="h-4 w-4" />
                Từ chối
              </Button>
              <Button
                variant="secondary"
                onClick={() => setAlternateModalOpen(true)}
                disabled={isMutating || isTerminal}
              >
                <Truck className="h-4 w-4" />
                Yêu cầu xe thay thế
              </Button>
            </div>

            {/* Alternate status banner */}
            {scan.alternate_vehicle_status !== 'NONE' ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-700">
                Trạng thái yêu cầu xe thay thế hiện tại:{' '}
                <strong>
                  {ALTERNATE_VEHICLE_STATUS_LABELS[scan.alternate_vehicle_status] ??
                    scan.alternate_vehicle_status}
                </strong>
              </div>
            ) : null}

            {/* ----- Retry ----- */}
            <section className="rounded-xl border border-slate-200 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">
                  Retry nhận diện với frame mới
                </p>
                <Badge variant="default" className="text-[10px]">
                  {retryFiles.length}/5
                </Badge>
              </div>

              <CameraCapturePanel
                onSubmit={(files) => handleRetryFiles(files)}
                isSubmitting={retryIsUploading}
                submitLabel="Lưu frame retry"
              />

              {retryFiles.length > 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-700">
                      {retryFiles.length} frame retry đã chọn
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setRetryFiles([])}
                      disabled={retryIsUploading || retryMutation.isPending}
                    >
                      Bỏ hết
                    </Button>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {retryFiles.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between gap-2 rounded-md bg-white px-2 py-1 text-xs text-slate-600"
                      >
                        <span className="truncate font-mono">
                          {file.name} · {(file.size / 1024).toFixed(0)} KB
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveRetryFile(index)}
                          disabled={retryIsUploading || retryMutation.isPending}
                        >
                          Bỏ
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    onClick={() => void handleRetrySubmit()}
                    disabled={
                      retryFiles.length === 0 ||
                      retryIsUploading ||
                      retryMutation.isPending ||
                      isTerminal
                    }
                    className="mt-3"
                  >
                    {retryMutation.isPending || retryIsUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4" />
                    )}
                    Gửi retry lên BE
                  </Button>
                </div>
              ) : null}
            </section>

            {scan.override_reason ? (
              <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
                  <ShieldAlert className="h-4 w-4" />
                  Override reason đã dùng:
                </p>
                <p className="mt-1 text-sm text-amber-900">
                  {scan.override_reason}
                </p>
              </section>
            ) : null}

            {scan.rejection_reason ? (
              <section className="rounded-xl border border-red-200 bg-red-50/40 p-3">
                <p className="text-sm font-semibold text-red-900">
                  Đã từ chối · Lý do:{' '}
                  <span className="font-normal">
                    {scan.rejection_reason}
                  </span>
                </p>
                {scan.rejection_note ? (
                  <p className="mt-1 text-sm text-red-900">
                    <Hash className="mr-1 inline h-3 w-3" />
                    {scan.rejection_note}
                  </p>
                ) : null}
              </section>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* ----- Modals ----- */}
      <ConfirmOverrideModal
        open={confirmModalOpen}
        scan={{
          normalized_plate: scan.normalized_plate,
          raw_plate_text: scan.raw_plate_text,
        }}
        candidate={selectedCandidate}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleOverrideConfirm}
        isSubmitting={confirmMutation.isPending}
      />
      <RejectScanModal
        open={rejectModalOpen}
        scanLabel={scan.normalized_plate ?? scan.raw_plate_text ?? '—'}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleReject}
        isSubmitting={rejectMutation.isPending}
      />
      <AlternateVehicleModal
        open={alternateModalOpen}
        scanLabel={scan.normalized_plate ?? scan.raw_plate_text ?? '—'}
        currentStatus={scan.alternate_vehicle_status}
        onClose={() => setAlternateModalOpen(false)}
        onSubmit={handleAlternate}
        isSubmitting={alternateMutation.isPending}
      />

      {/* Note: Upload icon imported for future file retry section */}
      <span className="hidden">
        <Upload />
      </span>
    </div>
  )
}
