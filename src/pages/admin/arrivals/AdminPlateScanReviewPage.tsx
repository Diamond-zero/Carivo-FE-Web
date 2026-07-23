import {
  AlertTriangle,
  ArrowRightLeft,
  CalendarClock,
  Camera as CameraIcon,
  CheckCircle2,
  ChevronLeft,
  Clock,
  ExternalLink,
  Hash,
  Info,
  Loader2,
  ScanLine,
  ShieldAlert,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import {
  ALTERNATE_VEHICLE_STATUS_LABELS,
  PLATE_CAPTURE_SOURCE_LABELS,
  PLATE_SCAN_MODE_LABELS,
  PLATE_SCAN_REJECTION_REASON_LABELS,
  PLATE_SCAN_STATUS_LABELS,
  PLATE_SCAN_STATUS_VARIANT,
} from '../../../api/plateScan.api'
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
  useAdminReviewAlternateVehicleMutation,
  useStaffPlateScanDetail,
} from '../../../hooks/api/staff/useStaffPlateScans'
import type { ApiAlternateVehicleValue } from '../../../types/api/plateScan'
import { formatDateTime } from '../../../utils/format'

const VARIANT_BADGE_CLASS: Record<string, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-sky-50 text-sky-700',
}

type AlternateAction = 'approve' | 'reject' | null

export function AdminPlateScanReviewPage() {
  const { scanId = '' } = useParams<{ scanId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [action, setAction] = useState<AlternateAction>(null)
  const [note, setNote] = useState('')

  const detailQuery = useStaffPlateScanDetail(scanId)
  const reviewMutation = useAdminReviewAlternateVehicleMutation(scanId)

  const scan = detailQuery.data

  const decision: AlternateAction = action
  const noteIsValid = note.trim().length >= 3

  if (detailQuery.isLoading) return <DashboardPageSkeleton />

  if (detailQuery.isError || !scan) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(detailQuery.error, 'Không thể tải scan này.')}
        </div>
      </div>
    )
  }

  const isAlternatePending = scan.alternate_vehicle_status === 'REQUESTED'
  const alternateVehicle: ApiAlternateVehicleValue | null =
    isAlternatePending && scan.alternate_vehicle
      ? (scan.alternate_vehicle as ApiAlternateVehicleValue)
      : null

  const variant = PLATE_SCAN_STATUS_VARIANT[scan.status]

  const handleReview = async () => {
    if (!decision) return
    if (!noteIsValid) {
      showToast('Ghi chú tối thiểu 3 ký tự.', 'error')
      return
    }
    try {
      await reviewMutation.mutateAsync({
        approved: decision === 'approve',
        note: note.trim(),
      })
      showToast(
        decision === 'approve'
          ? 'Đã phê duyệt yêu cầu xe thay thế.'
          : 'Đã từ chối yêu cầu xe thay thế.',
        'success',
      )
      setAction(null)
      setNote('')
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể xử lý yêu cầu.'),
        'error',
      )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
          Quay lại danh sách
        </Button>
      </div>

      <PageHeader
        eyebrow="Vận hành cổng"
        title={`Scan #${scan.id.replace(/^.*-/, '')}`}
        description={`Trạng thái hiện tại: ${PLATE_SCAN_STATUS_LABELS[scan.status]}. Xem chi tiết nhận diện, ứng viên, khung hình và phê duyệt nếu có yêu cầu xe thay thế.`}
        action={
          <Link to="/admin/arrivals/scans">
            <Button variant="secondary">
              <ScanLine className="h-4 w-4" />
              Tất cả lượt quét
            </Button>
          </Link>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Kết quả nhận diện</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${VARIANT_BADGE_CLASS[variant]}`}
              >
                {PLATE_SCAN_STATUS_LABELS[scan.status]}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                {scan.match_type}
              </span>
              <span className="text-xs text-slate-500">
                Confidence {(scan.confidence * 100).toFixed(1)}%
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="carivo-panel p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Biển số
                </p>
                <p className="mt-1 font-mono text-2xl font-bold uppercase text-slate-900">
                  {scan.normalized_plate ?? '—'}
                </p>
                {scan.raw_plate_text ? (
                  <p className="text-xs text-slate-500">
                    Raw: <span className="font-mono">{scan.raw_plate_text}</span>
                  </p>
                ) : null}
              </div>
              <div className="carivo-panel p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Mode / Capture source
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {PLATE_SCAN_MODE_LABELS[scan.mode]}
                </p>
                <p className="text-xs text-slate-500">
                  {PLATE_CAPTURE_SOURCE_LABELS[scan.capture_source]}
                </p>
              </div>

              <div className="carivo-panel p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Captured at
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-900">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {scan.captured_at ? formatDateTime(scan.captured_at) : '—'}
                </p>
                {scan.server_received_at ? (
                  <p className="text-xs text-slate-500">
                    BE nhận: {formatDateTime(scan.server_received_at)}
                  </p>
                ) : null}
              </div>
              <div className="carivo-panel p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Provider
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {scan.provider ?? '—'}
                </p>
                {scan.model_version ? (
                  <p className="text-xs text-slate-500">v{scan.model_version}</p>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">
                  Xử lý {scan.processing_time_ms}ms · retries {scan.retry_count}
                </p>
              </div>
            </div>

            {scan.quality_flags.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
                <p className="flex items-center gap-1 font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  Quality flags
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {scan.quality_flags.map((flag) => (
                    <span
                      key={flag}
                      className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {scan.failure_message ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <p className="flex items-center gap-1 font-semibold">
                  <XCircle className="h-4 w-4" />
                  Failure
                </p>
                <p className="mt-1 text-xs">{scan.failure_message}</p>
                {scan.failure_code ? (
                  <p className="mt-1 font-mono text-[11px] text-red-700">
                    code: {scan.failure_code}
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trạng thái phê duyệt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Alternate vehicle
            </p>
            <p className="text-sm text-slate-700">
              {ALTERNATE_VEHICLE_STATUS_LABELS[scan.alternate_vehicle_status]}
            </p>

            {scan.manual_override ? (
              <div className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-900">
                <p className="flex items-center gap-1 font-semibold">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Manual override
                </p>
                {scan.override_reason ? (
                  <p className="mt-1 italic">"{scan.override_reason}"</p>
                ) : null}
              </div>
            ) : null}

            {scan.rejection_reason ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                <p className="flex items-center gap-1 font-semibold">
                  <XCircle className="h-3.5 w-3.5" />
                  Đã reject
                </p>
                <p className="mt-1 text-rose-700">
                  {PLATE_SCAN_REJECTION_REASON_LABELS[scan.rejection_reason]}
                </p>
                {scan.rejection_note ? (
                  <p className="mt-1 italic">"{scan.rejection_note}"</p>
                ) : null}
              </div>
            ) : null}

            {isAlternatePending && alternateVehicle ? (
              <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs">
                <p className="flex items-center gap-1 font-semibold text-amber-900">
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Yêu cầu xe thay thế
                </p>
                <dl className="grid grid-cols-2 gap-y-1 text-amber-900">
                  <dt className="text-amber-700/80">Biển số</dt>
                  <dd className="font-mono text-sm font-bold uppercase">
                    {alternateVehicle.license_plate ?? '—'}
                  </dd>
                  <dt className="text-amber-700/80">Loại xe</dt>
                  <dd>{alternateVehicle.vehicle_type ?? '—'}</dd>
                  {alternateVehicle.brand ? (
                    <>
                      <dt className="text-amber-700/80">Hãng</dt>
                      <dd>{alternateVehicle.brand}</dd>
                    </>
                  ) : null}
                  {alternateVehicle.model ? (
                    <>
                      <dt className="text-amber-700/80">Model</dt>
                      <dd>{alternateVehicle.model}</dd>
                    </>
                  ) : null}
                  {alternateVehicle.color ? (
                    <>
                      <dt className="text-amber-700/80">Màu</dt>
                      <dd>{alternateVehicle.color}</dd>
                    </>
                  ) : null}
                </dl>
                <div>
                  <p className="text-amber-700/80">Lý do</p>
                  <p className="mt-1 italic text-amber-900">
                    "{alternateVehicle.reason ?? '—'}"
                  </p>
                </div>
                <div className="space-y-2 pt-1">
                  <textarea
                    value={note}
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setNote(event.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Ghi chú admin (tối thiểu 3 ký tự)…"
                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={action === 'approve' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setAction('approve')}
                      disabled={reviewMutation.isPending}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Phê duyệt
                    </Button>
                    <Button
                      variant={action === 'reject' ? 'danger' : 'secondary'}
                      size="sm"
                      onClick={() => setAction('reject')}
                      disabled={reviewMutation.isPending}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Từ chối
                    </Button>
                  </div>
                  {decision && noteIsValid ? (
                    <Button
                      variant={action === 'reject' ? 'danger' : 'primary'}
                      onClick={handleReview}
                      disabled={reviewMutation.isPending}
                      className="w-full"
                    >
                      {reviewMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Xác nhận {action === 'approve' ? 'phê duyệt' : 'từ chối'}
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="space-y-2 pt-2 text-xs">
              <p className="flex items-center gap-1 text-slate-500">
                <Hash className="h-3 w-3" />
                ID staff: <span className="font-mono">{scan.staff_id ?? '—'}</span>
              </p>
              <p className="flex items-center gap-1 text-slate-500">
                <CameraIcon className="h-3 w-3" />
                Camera:{' '}
                <span className="font-mono">{scan.camera_device_id ?? '—'}</span>
              </p>
              {scan.confirmed_at ? (
                <p className="flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Confirmed {formatDateTime(scan.confirmed_at)}
                </p>
              ) : null}
              {scan.expires_at && ['EXACT_MATCH', 'FUZZY_CANDIDATES', 'AMBIGUOUS'].includes(scan.status) ? (
                <p className="flex items-center gap-1 text-amber-700">
                  <Clock className="h-3 w-3" />
                  Hết hạn {formatDateTime(scan.expires_at)}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Booking ứng viên ({scan.candidates.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {scan.candidates.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              <Info className="mx-auto mb-2 h-5 w-5 text-slate-300" />
              BE không tìm thấy booking nào trùng biển số.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Booking</th>
                    <th className="px-4 py-3">Biển số khớp</th>
                    <th className="px-4 py-3">Match</th>
                    <th className="px-4 py-3">Edit dist.</th>
                    <th className="px-4 py-3">Δ schedule (min)</th>
                    <th className="px-4 py-3">Vehicle mismatch</th>
                    <th className="px-4 py-3 text-right">Mở booking</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scan.candidates.map((candidate, idx) => (
                    <tr key={candidate.booking_id ?? `cand-${idx}`} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono text-xs">
                        {candidate.booking_id?.replace(/^.*-/, '#') ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold uppercase">
                        {candidate.booking?.license_plate ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {candidate.match_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {candidate.edit_distance}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {candidate.scheduled_distance_minutes}
                      </td>
                      <td className="px-4 py-3">
                        {candidate.vehicle_type_mismatch ? (
                          <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                            Có
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Không</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {candidate.booking_id ? (
                          <Link to={`/bookings/${candidate.booking_id}`}>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-3.5 w-3.5" />
                              Mở
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {scan.frame_results.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Frame results ({scan.frame_results.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {scan.frame_results.map((frame) => (
                <a
                  key={frame.upload_id ?? frame.id}
                  href={frame.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-brand-400"
                >
                  <img
                    src={frame.url}
                    alt={frame.upload_id ?? frame.id}
                    className="aspect-video w-full object-cover"
                  />
                  <div className="space-y-1 px-3 py-2 text-[11px] text-slate-500">
                    <p className="font-mono">
                      {frame.upload_id?.replace(/^.*-/, '#') ?? '—'}
                    </p>
                    {frame.width && frame.height ? (
                      <p>
                        {frame.width}×{frame.height}
                      </p>
                    ) : null}
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
