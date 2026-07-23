// ============================================================================
// Staff Plate Scan Detail — canonical fields theo BE `bookingArrival.swagger.js`
// (2025-07).
// - `frame_results[]` thay cho `frames[]`
// - `candidates[].booking` (DTO booking), không còn `expected_plate/conf/customer_*`
// - `normalize_plate` / `raw_plate_text` thay cho `detected_plate`
// - Payload: `upload_ids` (retry), `license_plate + vehicle_type + reason` (alternate)
//   → Override reason bắt buộc khi FUZZY / MANUAL.
// ============================================================================

import {
  AlertTriangle,
  ArrowLeft,
  Car,
  CheckCircle2,
  Clock,
  Crop,
  Hash,
  Loader2,
  RefreshCcw,
  ScanLine,
  Send,
  ShieldAlert,
  Truck,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getApiErrorMessage } from '../../../api/client'
import { uploadFileApi } from '../../../api/upload.api'
import {
  ALTERNATE_VEHICLE_STATUS_LABELS,
  PLATE_SCAN_REJECTION_REASON_LABELS,
  PLATE_SCAN_STATUS_LABELS,
  PLATE_SCAN_STATUS_VARIANT,
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
import { Label } from '../../../components/ui/Label'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import {
  useConfirmPlateScanMutation,
  useRejectPlateScanMutation,
  useRequestAlternateVehicleMutation,
  useRetryPlateScanMutation,
  useStaffPlateScanDetail,
} from '../../../hooks/api/staff/useStaffPlateScans'
import type {
  ApiPlateScanCandidate,
  ApiPlateScanFrame,
  ApiRejectPlateScanPayload,
  ApiRequestAlternateVehiclePayload,
  PlateScanRejectionReason,
  PlateScanVehicleType,
} from '../../../types/api/plateScan'
import { formatDateTime } from '../../../utils/format'

const REJECTION_REASONS = Object.keys(
  PLATE_SCAN_REJECTION_REASON_LABELS,
) as PlateScanRejectionReason[]

const VEHICLE_TYPES: PlateScanVehicleType[] = ['CAR', 'MOTORBIKE']

export function StaffPlateScanDetailPage() {
  const { scanId } = useParams()
  const { showToast } = useToast()

  const detailQuery = useStaffPlateScanDetail(scanId)
  const confirmMutation = useConfirmPlateScanMutation(scanId ?? '')
  const rejectMutation = useRejectPlateScanMutation(scanId ?? '')
  const alternateMutation = useRequestAlternateVehicleMutation(scanId ?? '')
  const retryMutation = useRetryPlateScanMutation(scanId ?? '')

  // Form state ------------------------------------------------------------
  const [selectedCandidateId, setSelectedCandidateId] = useState<
    string | null
  >(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideOpen, setOverrideOpen] = useState(false)

  const [rejectReason, setRejectReason] = useState<PlateScanRejectionReason | ''>(
    '',
  )
  const [rejectNote, setRejectNote] = useState('')

  const [altLicensePlate, setAltLicensePlate] = useState('')
  const [altVehicleType, setAltVehicleType] = useState<PlateScanVehicleType>(
    'CAR',
  )
  const [altBrand, setAltBrand] = useState('')
  const [altModel, setAltModel] = useState('')
  const [altColor, setAltColor] = useState('')
  const [altReason, setAltReason] = useState('')

  const [retryFiles, setRetryFiles] = useState<File[]>([])
  const [retryIsUploading, setRetryIsUploading] = useState(false)

  // -------------------------------------------------------------------------

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
  const candidates: ApiPlateScanCandidate[] = scan.candidates ?? []
  const frames: ApiPlateScanFrame[] = scan.frame_results ?? []
  const status = scan.status
  const statusLabel = PLATE_SCAN_STATUS_LABELS[status] ?? status
  const statusVariant = PLATE_SCAN_STATUS_VARIANT[status] ?? 'default'

  const isMutating =
    confirmMutation.isPending ||
    rejectMutation.isPending ||
    alternateMutation.isPending ||
    retryMutation.isPending

  const selectedCandidate = useMemo(
    () => candidates.find((c) => c.booking_id === selectedCandidateId) ?? null,
    [candidates, selectedCandidateId],
  )

  const requiresOverride =
    selectedCandidate !== null && selectedCandidate.match_type !== 'EXACT'

  const isTerminal =
    status === 'CONFIRMED' ||
    status === 'REJECTED' ||
    status === 'EXPIRED' ||
    status === 'FAILED'

  // ----- Handlers --------------------------------------------------------

  const handleConfirm = async () => {
    if (!selectedCandidateId || !selectedCandidate) {
      showToast('Vui lòng chọn 1 booking để xác nhận.', 'error')
      return
    }
    if (requiresOverride && overrideReason.trim().length < 5) {
      showToast(
        'Override reason bắt buộc cho fuzzy/manual (tối thiểu 5 ký tự).',
        'error',
      )
      return
    }
    try {
      await confirmMutation.mutateAsync({
        booking_id: selectedCandidate.booking_id,
        override_reason:
          requiresOverride && overrideReason.trim()
            ? overrideReason.trim()
            : undefined,
      })
      showToast('Đã xác nhận check-in cho booking.', 'success')
      setOverrideOpen(false)
      setOverrideReason('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể xác nhận.'), 'error')
    }
  }

  const handleOpenConfirm = () => {
    if (!selectedCandidateId) {
      showToast('Vui lòng chọn 1 booking để xác nhận.', 'error')
      return
    }
    if (requiresOverride) {
      setOverrideOpen(true)
      return
    }
    void handleConfirm()
  }

  const handleReject = async () => {
    if (!rejectReason) {
      showToast('Vui lòng chọn lý do từ chối.', 'error')
      return
    }
    try {
      const payload: ApiRejectPlateScanPayload = { reason: rejectReason }
      if (rejectNote.trim()) payload.note = rejectNote.trim()
      await rejectMutation.mutateAsync(payload)
      showToast('Đã từ chối lượt quét.', 'success')
      setRejectReason('')
      setRejectNote('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể từ chối.'), 'error')
    }
  }

  const handleAlternate = async () => {
    if (altLicensePlate.trim().length < 4 || altLicensePlate.trim().length > 30) {
      showToast('Biển số thay thế 4–30 ký tự.', 'error')
      return
    }
    if (altReason.trim().length < 5) {
      showToast('Lý do tối thiểu 5 ký tự.', 'error')
      return
    }
    const payload: ApiRequestAlternateVehiclePayload = {
      license_plate: altLicensePlate.trim(),
      vehicle_type: altVehicleType,
      reason: altReason.trim(),
    }
    if (altBrand.trim()) payload.brand = altBrand.trim()
    if (altModel.trim()) payload.model = altModel.trim()
    if (altColor.trim()) payload.color = altColor.trim()
    try {
      await alternateMutation.mutateAsync(payload)
      showToast('Đã gửi yêu cầu dùng xe thay thế — chờ admin duyệt.', 'success')
      setAltLicensePlate('')
      setAltBrand('')
      setAltModel('')
      setAltColor('')
      setAltReason('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể yêu cầu xe thay thế.'), 'error')
    }
  }

  const handleRetryFiles = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    const list = Array.from(files).slice(0, 5)
    setRetryFiles(list)
    event.target.value = ''
  }

  const handleRetry = async () => {
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
      await retryMutation.mutateAsync({
        upload_ids: uploadIds,
        mode: uploadIds.length > 1 ? 'LIVE_BATCH' : 'SINGLE',
        capture_source: uploadIds.length > 1 ? 'LIVE_CAMERA' : 'STAFF_CAMERA',
      })
      showToast('Đã gửi retry. Vui lòng đợi BE xử lý.', 'success')
      setRetryFiles([])
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể retry.'), 'error')
    } finally {
      setRetryIsUploading(false)
    }
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
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <Clock className="h-3.5 w-3.5" />
            Hết hạn lúc {formatDateTime(scan.expires_at)}
          </div>
        ) : null}
      </div>

      <PageHeader
        eyebrow="Carivo Staff"
        title={`Lượt quét · ${
          scan.normalized_plate ?? scan.raw_plate_text ?? '—'
        }`}
        description={
          scan.captured_at
            ? `Chụp lúc ${formatDateTime(scan.captured_at)} · ${scan.mode}`
            : scan.mode ?? undefined
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            {scan.manual_override ? (
              <Badge variant="warning">
                <ShieldAlert className="mr-1 h-3 w-3" />
                Manual override
              </Badge>
            ) : null}
            <Badge variant={statusVariant}>{statusLabel}</Badge>
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
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
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
              Chọn 1 booking để xác nhận check-in. Fuzzy / Manual bắt buộc có
              override reason.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {candidates.length === 0 ? (
              <p className="text-sm text-slate-500">
                BE không tìm được booking nào khớp.
              </p>
            ) : (
              candidates.map((candidate) => {
                const booking = candidate.booking as
                  | { id?: string; license_plate?: string; normalized_license_plate?: string; start_time?: string; customer?: { full_name?: string }; vehicle?: { brand?: string; model?: string; color?: string } }
                  | null
                const customerName =
                  booking?.customer?.full_name ?? '—'
                const vehicleLabel = booking?.vehicle
                  ? `${booking.vehicle.brand ?? ''} ${
                      booking.vehicle.model ?? ''
                    }`.trim() || booking.vehicle.color || '—'
                  : '—'
                return (
                  <label
                    key={candidate.booking_id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                      selectedCandidateId === candidate.booking_id
                        ? 'border-brand-500 bg-brand-50/40'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="candidate"
                      className="mt-1"
                      checked={selectedCandidateId === candidate.booking_id}
                      onChange={() => setSelectedCandidateId(candidate.booking_id)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono font-bold text-slate-900">
                          {booking?.license_plate ??
                            scan.normalized_plate ??
                            '—'}
                        </p>
                        <Badge
                          variant={
                            candidate.match_type === 'EXACT'
                              ? 'success'
                              : candidate.match_type === 'FUZZY'
                                ? 'warning'
                                : candidate.match_type === 'MANUAL'
                                  ? 'info'
                                  : 'default'
                          }
                        >
                          {candidate.match_type} ·{' '}
                          {Math.round(
                            (1 - (candidate.edit_distance ?? 0) / 8) * 100,
                          )}
                          %
                        </Badge>
                        {candidate.vehicle_type_mismatch ? (
                          <Badge variant="warning">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Loại xe lệch
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-slate-700">
                        {customerName} · {vehicleLabel}
                      </p>
                      <p className="text-xs text-slate-500">
                        Booking #{candidate.booking_id.slice(-6)} ·{' '}
                        {booking?.start_time
                          ? formatDateTime(booking.start_time)
                          : ''}
                        {candidate.scheduled_distance_minutes
                          ? ` · lệch ${candidate.scheduled_distance_minutes}p`
                          : ''}
                      </p>
                    </div>
                  </label>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* ----- Actions ----- */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Hành động</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Confirm + Reject */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleOpenConfirm}
                disabled={isMutating || isTerminal || candidates.length === 0}
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
                onClick={handleReject}
                disabled={isMutating || isTerminal}
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Từ chối
              </Button>
            </div>

            {/* Reject reason dropdown + note */}
            <section className="rounded-xl border border-slate-200 p-3 space-y-3">
              <p className="text-sm font-medium text-slate-700">
                Từ chối — chọn lý do
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="reject-reason">Lý do</Label>
                  <select
                    id="reject-reason"
                    className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    value={rejectReason}
                    onChange={(event) =>
                      setRejectReason(
                        event.target.value as PlateScanRejectionReason | '',
                      )
                    }
                  >
                    <option value="">— Chọn lý do —</option>
                    {REJECTION_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {PLATE_SCAN_REJECTION_REASON_LABELS[reason]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="reject-note">Ghi chú (optional)</Label>
                  <input
                    id="reject-note"
                    className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    value={rejectNote}
                    onChange={(event) => setRejectNote(event.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Alternate vehicle */}
            <section className="rounded-xl border border-slate-200 p-3 space-y-3">
              <p className="text-sm font-medium text-slate-700">
                Yêu cầu dùng xe thay thế
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="alt-plate">Biển số</Label>
                  <input
                    id="alt-plate"
                    placeholder="VD: 51A-123.45"
                    className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    value={altLicensePlate}
                    onChange={(event) => setAltLicensePlate(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="alt-type">Loại xe</Label>
                  <select
                    id="alt-type"
                    className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    value={altVehicleType}
                    onChange={(event) =>
                      setAltVehicleType(
                        event.target.value as PlateScanVehicleType,
                      )
                    }
                  >
                    {VEHICLE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type === 'CAR' ? 'Ô tô' : 'Xe máy'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="alt-brand">Hãng (optional)</Label>
                  <input
                    id="alt-brand"
                    className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    value={altBrand}
                    onChange={(event) => setAltBrand(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="alt-model">Model (optional)</Label>
                  <input
                    id="alt-model"
                    className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    value={altModel}
                    onChange={(event) => setAltModel(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="alt-color">Màu (optional)</Label>
                  <input
                    id="alt-color"
                    className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    value={altColor}
                    onChange={(event) => setAltColor(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="alt-reason">
                    <span className="flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5 text-slate-500" />
                      Lý do (tối thiểu 5 ký tự)
                    </span>
                  </Label>
                  <input
                    id="alt-reason"
                    className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    value={altReason}
                    onChange={(event) => setAltReason(event.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={handleAlternate}
                disabled={isMutating || isTerminal}
                variant="secondary"
              >
                {alternateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
                Gửi yêu cầu xe thay thế
              </Button>
              {scan.alternate_vehicle_status !== 'NONE' &&
              scan.alternate_vehicle_status ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-700">
                  Trạng thái yêu cầu hiện tại:{' '}
                  <strong>
                    {ALTERNATE_VEHICLE_STATUS_LABELS[scan.alternate_vehicle_status] ??
                      scan.alternate_vehicle_status}
                  </strong>
                </div>
              ) : null}
            </section>

            {/* Retry */}
            <section className="rounded-xl border border-slate-200 p-3 space-y-3">
              <p className="text-sm font-medium text-slate-700">
                Retry nhận diện với frame mới
              </p>
              <div>
                <Label htmlFor="retry-files">
                  Ảnh mới (tối đa 5, SINGLE hoặc LIVE_BATCH)
                </Label>
                <input
                  id="retry-files"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleRetryFiles}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                />
                {retryFiles.length > 0 ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Đã chọn {retryFiles.length} ảnh.
                  </p>
                ) : null}
              </div>
              <Button
                onClick={handleRetry}
                disabled={
                  isMutating || isTerminal || retryFiles.length === 0 || retryIsUploading
                }
                variant="secondary"
              >
                {retryMutation.isPending || retryIsUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                Gửi retry
              </Button>
            </section>
          </CardContent>
        </Card>
      </div>

      {/* ----- Override reason modal (FUZZY/MANUAL) ----- */}
      {overrideOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-white shadow-[var(--shadow-carivo-lg)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white px-6 py-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                <div>
                  <h2 className="text-base font-bold tracking-tight text-slate-900">
                    Bắt buộc nhập lý do override
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Booking khớp{' '}
                    <span className="font-mono">
                      {selectedCandidate?.match_type}
                    </span>{' '}
                    — staff phải giải thích lý do chọn thay vì để BE tự match.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOverrideOpen(false)}
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="px-6 py-5">
              <Label htmlFor="override-reason-modal">
                Lý do (tối thiểu 5 ký tự)
              </Label>
              <textarea
                id="override-reason-modal"
                rows={3}
                placeholder="VD: Biển số bị mờ nên BE match sai, tôi xác nhận trực tiếp với khách."
                className="mt-2 min-h-[100px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                value={overrideReason}
                onChange={(event) => setOverrideReason(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-3">
              <Button
                variant="ghost"
                onClick={() => setOverrideOpen(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={overrideReason.trim().length < 5}
              >
                {confirmMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
