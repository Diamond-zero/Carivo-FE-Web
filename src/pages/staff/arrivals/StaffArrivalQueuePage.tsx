// ============================================================================
// Staff Arrival Queue — BE base `/staff/booking-arrivals`.
// Phase 2: rewrite theo canonical hooks + fields. Phase 2.1 sẽ bổ sung
// getUserMedia + upload flow ở đây (camera capture panel).
// ============================================================================

import {
  ArrowRight,
  Camera,
  History,
  Loader2,
  ScanLine,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import {
  useCreatePlateScanMutation,
  useStaffArrivalQueue,
  useStaffPlateScans,
} from '../../../hooks/api/staff/useStaffPlateScans'
import { getApiErrorMessage } from '../../../api/client'
import { uploadFileApi } from '../../../api/upload.api'
import {
  PLATE_SCAN_STATUS_LABELS,
  PLATE_SCAN_STATUS_VARIANT,
} from '../../../api/plateScan.api'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Label } from '../../../components/ui/Label'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import type {
  ApiCreatePlateScanPayload,
  ApiPlateScan,
} from '../../../types/api/plateScan'
import { formatDateTime } from '../../../utils/format'

export function StaffArrivalQueuePage() {
  const { showToast } = useToast()
  const queueQuery = useStaffArrivalQueue()
  const scansQuery = useStaffPlateScans()
  const createScanMutation = useCreatePlateScanMutation()

  const [pendingUploadIds, setPendingUploadIds] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const queueItems: ApiPlateScan[] =
    (queueQuery.data?.data ?? []) as ApiPlateScan[]
  const recentScans: ApiPlateScan[] = scansQuery.data?.data ?? []

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    setIsUploading(true)
    const uploaded: string[] = []
    try {
      for (const file of Array.from(files)) {
        const upload = await uploadFileApi(file, {
          purpose: 'BOOKING_PLATE_SCAN',
        })
        uploaded.push(upload.id)
      }
      setPendingUploadIds((current) => [...current, ...uploaded])
      showToast(
        `Đã upload ${uploaded.length} ảnh. Nhấn "Nhận diện" để BE xử lý.`,
        'success',
      )
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể upload ảnh.'), 'error')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleRemovePending = (id: string) => {
    setPendingUploadIds((current) => current.filter((x) => x !== id))
  }

  const handleRecognize = async () => {
    if (pendingUploadIds.length === 0) {
      showToast('Vui lòng upload ít nhất một ảnh biển số.', 'error')
      return
    }
    if (pendingUploadIds.length > 5) {
      showToast('Tối đa 5 ảnh mỗi lượt quét.', 'error')
      return
    }
    // Tạm lấy garage từ 1 scan trước (fallback). Phase 2.1 sẽ có dropdown
    // chọn garage cho staff multi-garage.
    const fallbackGarageId =
      queueItems[0]?.garage_id ?? recentScans[0]?.garage_id

    if (!fallbackGarageId) {
      showToast(
        'Không xác định được garage. Vui lòng thử lại sau khi đã có lượt quét.',
        'error',
      )
      return
    }

    const isBatch = pendingUploadIds.length > 1
    const payload: ApiCreatePlateScanPayload = {
      garage_id: fallbackGarageId,
      upload_ids: pendingUploadIds,
      mode: isBatch ? 'LIVE_BATCH' : 'SINGLE',
      capture_source: isBatch ? 'LIVE_CAMERA' : 'STAFF_CAMERA',
    }

    try {
      const scan = await createScanMutation.mutateAsync(payload)
      setPendingUploadIds([])
      const last6 = scan.id.slice(-6)
      showToast(
        `Đã gửi ${pendingUploadIds.length} ảnh nhận diện. Mã lượt quét: …${last6}.`,
        'success',
      )
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể nhận diện.'), 'error')
    }
  }

  if (queueQuery.isLoading && scansQuery.isLoading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Staff"
        title="Camera cổng"
        description="Theo dõi các lượt quét biển số tại cổng garage và xác nhận check-in cho booking phù hợp."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-5 w-5 text-slate-500" />
              Hàng chờ xe đến
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queueItems.length === 0 ? (
              <EmptyState
                icon={Camera}
                title="Chưa có xe đến"
                description="Khi camera cổng nhận diện được biển số với độ khớp cao, lượt quét sẽ xuất hiện ở đây để staff xác nhận check-in."
              />
            ) : (
              <ul className="space-y-2">
                {queueItems.map((scan) => (
                  <li
                    key={scan.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-base font-bold text-slate-900">
                        {scan.normalized_plate ?? scan.raw_plate_text ?? '?'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Độ khớp{' '}
                        {scan.confidence
                          ? `${(scan.confidence * 100).toFixed(0)}%`
                          : '—'}
                        {scan.matched_booking_id
                          ? ` · Booking #${scan.matched_booking_id.slice(-6)}`
                          : ''}
                      </p>
                      {scan.captured_at ? (
                        <p className="text-xs text-slate-500">
                          Lúc {formatDateTime(scan.captured_at)}
                        </p>
                      ) : null}
                    </div>
                    <Link to={`/staff/arrivals/${scan.id}`}>
                      <Button size="sm" variant="secondary">
                        Mở
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanLine className="h-5 w-5 text-slate-500" />
              Upload ảnh nhận diện thủ công
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Upload 1 ảnh (SINGLE) hoặc 2–5 ảnh chụp liên tiếp (LIVE_BATCH).
              Hệ thống sẽ tự nhận diện biển số và đối chiếu với booking.
            </p>

            <div>
              <Label htmlFor="frame-upload">Ảnh biển số (tối đa 5 ảnh)</Label>
              <input
                id="frame-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                disabled={isUploading}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
              />
              {isUploading ? (
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Đang upload…
                </div>
              ) : null}
            </div>

            {pendingUploadIds.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-700">
                  Đã upload {pendingUploadIds.length} ảnh — sẵn sàng nhận diện:
                </p>
                <ul className="mt-2 space-y-1">
                  {pendingUploadIds.map((id) => (
                    <li
                      key={id}
                      className="flex items-center justify-between gap-2 font-mono text-xs text-slate-600"
                    >
                      <span className="truncate">…{id.slice(-12)}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemovePending(id)}
                      >
                        Bỏ
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Button
              onClick={handleRecognize}
              disabled={
                createScanMutation.isPending ||
                isUploading ||
                pendingUploadIds.length === 0
              }
              className="w-full sm:w-auto"
            >
              {createScanMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ScanLine className="h-4 w-4" />
              )}
              Gửi nhận diện ({pendingUploadIds.length || 0})
            </Button>
            {pendingUploadIds.length > 1 ? (
              <p className="text-xs text-slate-500">
                Chế độ LIVE_BATCH — BE sẽ vote kết quả theo biển số.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5 text-slate-500" />
            Lịch sử quét gần đây
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {recentScans.length === 0 ? (
            <p className="px-6 py-4 text-sm text-slate-500">
              Chưa có lượt quét nào.
            </p>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Biển số</th>
                  <th className="px-6 py-3">Độ khớp</th>
                  <th className="px-6 py-3">Mode</th>
                  <th className="px-6 py-3">Booking khớp</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Thời gian</th>
                  <th className="px-6 py-3 text-right">Mở</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {scan.normalized_plate ?? scan.raw_plate_text ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {scan.confidence
                        ? `${(scan.confidence * 100).toFixed(0)}%`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {scan.mode ?? '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700">
                      {scan.matched_booking_id
                        ? `#${scan.matched_booking_id.slice(-6)}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          PLATE_SCAN_STATUS_VARIANT[scan.status] ?? 'default'
                        }
                      >
                        {PLATE_SCAN_STATUS_LABELS[scan.status] ?? scan.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {scan.captured_at
                        ? formatDateTime(scan.captured_at)
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/staff/arrivals/${scan.id}`}>
                        <Button size="sm" variant="ghost">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
