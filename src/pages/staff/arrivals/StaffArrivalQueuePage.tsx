// ============================================================================
// Staff Arrival Queue — Phase 2.10.
//
// Phase 1: rewrite types/payloads theo canonical.
// Phase 2: integrate CameraCapturePanel + PlateScanTabs. Staff giờ có thể:
//   - Bật camera trực tiếp từ tablet (STAFF_CAMERA)
//   - Hoặc upload file từ desktop (GALLERY)
// Garage lấy từ capability context (`useCanStaffCapability().data.garage_id`) —
// không cần user chọn vì staff đã được assign 1 garage duy nhất (theo
// `bookingArrival.service.getStaffGarageId`).
// ============================================================================

import {
  ArrowRight,
  Camera,
  History,
  Info,
  ScanLine,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import {
  useCreatePlateScanMutation,
  useStaffArrivalQueue,
  useStaffPlateScans,
} from '../../../hooks/api/staff/useStaffPlateScans'
import { useCanStaffCapability } from '../../../hooks/api/staff/useStaffCapabilities'
import { getApiErrorMessage } from '../../../api/client'
import { uploadFileApi } from '../../../api/upload.api'
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
import { EmptyState } from '../../../components/ui/EmptyState'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import {
  CameraCapturePanel,
} from '../../../components/staff/plate-scan/CameraCapturePanel'
import {
  PlateScanExpiryCountdown,
} from '../../../components/staff/plate-scan/PlateScanExpiryCountdown'
import { PlateScanStatusBadge } from '../../../components/staff/plate-scan/PlateScanStatusBadge'
import { PlateScanTabs } from '../../../components/staff/plate-scan/PlateScanTabs'
import { cn } from '../../../lib/utils'
import type {
  ApiCreatePlateScanPayload,
  ApiPlateScan,
  PlateCaptureSource,
} from '../../../types/api/plateScan'
import { formatDateTime } from '../../../utils/format'

const MAX_GALLERY_FILES = 5

export function StaffArrivalQueuePage() {
  const { showToast } = useToast()
  const { data: capability } = useCanStaffCapability()

  const queueQuery = useStaffArrivalQueue()
  const scansQuery = useStaffPlateScans()
  const createScanMutation = useCreatePlateScanMutation()

  // Tab + form state -------------------------------------------------------
  const [activeCaptureSource, setActiveCaptureSource] =
    useState<PlateCaptureSource>('STAFF_CAMERA')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const queueItems: ApiPlateScan[] =
    (queueQuery.data?.data ?? []) as ApiPlateScan[]
  const recentScans: ApiPlateScan[] = scansQuery.data?.data ?? []

  // Garage fallback chain: capability → first scan → null
  const assignedGarageId =
    capability?.garage_id ?? recentScans[0]?.garage_id ?? null

  // ----- Upload từ gallery -------------------------------------------------

  const handleGalleryUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    const list = Array.from(files).slice(0, MAX_GALLERY_FILES)
    setPendingFiles((current) => [...current, ...list].slice(0, MAX_GALLERY_FILES))
    event.target.value = ''
  }

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles((current) => current.filter((_, i) => i !== index))
  }

  // ----- Submit (camera hoặc gallery) -------------------------------------

  const handleSubmit = async (
    files: File[],
    cameraMode: 'SINGLE' | 'LIVE_BATCH',
  ) => {
    if (!assignedGarageId) {
      showToast(
        'Không xác định được garage của bạn. Hãy liên hệ admin.',
        'error',
      )
      return
    }
    if (files.length === 0) {
      showToast('Vui lòng chụp/upload ít nhất 1 ảnh.', 'error')
      return
    }

    setIsUploading(true)
    try {
      const uploadIds: string[] = []
      for (const file of files) {
        const upload = await uploadFileApi(file, {
          purpose: 'BOOKING_PLATE_SCAN',
        })
        uploadIds.push(upload.id)
      }

      const isBatch = uploadIds.length > 1
      const payload: ApiCreatePlateScanPayload = {
        garage_id: assignedGarageId,
        upload_ids: uploadIds,
        mode: isBatch ? 'LIVE_BATCH' : 'SINGLE',
        capture_source: activeCaptureSource,
      }

      const scan = await createScanMutation.mutateAsync(payload)
      setPendingFiles([])
      const last6 = scan.id.slice(-6)
      const isMulti = uploadIds.length > 1
      showToast(
        isMulti
          ? `Đã gửi ${uploadIds.length} ảnh (LIVE_BATCH). Mã lượt quét: …${last6}.`
          : `Đã gửi 1 ảnh (SINGLE). Mã lượt quét: …${last6}.`,
        'success',
      )
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể gửi nhận diện.'), 'error')
    } finally {
      setIsUploading(false)
      // Capture-mode just consumes mode param to keep signature compatible
      void cameraMode
    }
  }

  // ----- Gallery upload sub-panel (rendered inside PlateScanTabs child[1]) -

  const galleryUploadPanel = (
    <div className="space-y-3">
      <div>
        <label
          htmlFor="gallery-upload"
          className="block text-sm font-medium text-slate-700"
        >
          Ảnh biển số (tối đa {MAX_GALLERY_FILES} ảnh)
        </label>
        <input
          id="gallery-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleGalleryUpload}
          disabled={isUploading || createScanMutation.isPending}
          className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
        />
      </div>

      {pendingFiles.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-700">
              {pendingFiles.length} ảnh đã chọn
              {pendingFiles.length > 1 ? ' (sẽ gửi LIVE_BATCH)' : ' (SINGLE)'}
            </p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setPendingFiles([])}
              disabled={isUploading || createScanMutation.isPending}
            >
              Bỏ hết
            </Button>
          </div>
          <ul className="mt-2 space-y-1">
            {pendingFiles.map((file, index) => (
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
                  onClick={() => handleRemovePendingFile(index)}
                  disabled={isUploading || createScanMutation.isPending}
                >
                  Bỏ
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Button
        onClick={() => void handleSubmit(pendingFiles, 'SINGLE')}
        disabled={
          isUploading ||
          createScanMutation.isPending ||
          pendingFiles.length === 0
        }
        className="w-full sm:w-auto"
      >
        <ScanLine className="h-4 w-4" />
        Gửi nhận diện ({pendingFiles.length})
      </Button>
    </div>
  )

  const cameraPanel = (
    <CameraCapturePanel
      onSubmit={(files, mode) => void handleSubmit(files, mode)}
      isSubmitting={isUploading || createScanMutation.isPending}
    />
  )

  // ----- Render ------------------------------------------------------------

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

      {!assignedGarageId ? (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Bạn chưa được gán garage. Hãy liên hệ admin để được phân công trước
            khi quét biển số — BE sẽ từ chối nếu thiếu garage assignment.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ----- Cột trái: Hàng chờ (gate camera ARRIVAL_DETECTED) ----- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-5 w-5 text-slate-500" />
              Hàng chờ xe đến ({queueItems.length})
            </CardTitle>
            <CardDescription>
              BE tự đẩy vào đây khi camera cổng nhận diện biển số với độ khớp
              cao. Staff xác nhận check-in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queueItems.length === 0 ? (
              <EmptyState
                icon={Camera}
                title="Chưa có xe đến"
                description="Khi camera cổng nhận diện được biển số, lượt quét sẽ xuất hiện ở đây để staff xác nhận check-in."
              />
            ) : (
              <ul className="space-y-2">
                {queueItems.map((scan) => (
                  <li
                    key={scan.id}
                    className={cn(
                      'flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50/50',
                      scan.expires_at && new Date(scan.expires_at) < new Date()
                        ? 'opacity-60'
                        : '',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-base font-bold text-slate-900">
                          {scan.normalized_plate ?? scan.raw_plate_text ?? '?'}
                        </p>
                        <Badge variant="info" className="text-[10px]">
                          {scan.mode}
                        </Badge>
                      </div>
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
                          {formatDateTime(scan.captured_at)}
                        </p>
                      ) : null}
                      {scan.expires_at ? (
                        <div className="mt-1">
                          <PlateScanExpiryCountdown
                            expiresAt={scan.expires_at}
                            showAbsolute={false}
                          />
                        </div>
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

        {/* ----- Cột phải: Camera + Gallery (STAFF_CAMERA | GALLERY) ----- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-slate-500" />
              Nhận diện biển số
            </CardTitle>
            <CardDescription>
              Staff chụp trực tiếp từ thiết bị hoặc upload ảnh có sẵn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlateScanTabs
              isSubmitting={isUploading || createScanMutation.isPending}
              activeCaptureSource={activeCaptureSource}
              onChange={setActiveCaptureSource}
            >
              {[cameraPanel, galleryUploadPanel]}
            </PlateScanTabs>
          </CardContent>
        </Card>
      </div>

      {/* ----- Lịch sử quét gần đây ----- */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5 text-slate-500" />
            Lịch sử quét gần đây ({recentScans.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {recentScans.length === 0 ? (
            <p className="px-6 py-4 text-sm text-slate-500">
              Chưa có lượt quét nào.
            </p>
          ) : (
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Biển số</th>
                  <th className="px-6 py-3">Độ khớp</th>
                  <th className="px-6 py-3">Mode</th>
                  <th className="px-6 py-3">Nguồn</th>
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
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {scan.capture_source ?? '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700">
                      {scan.matched_booking_id
                        ? `#${scan.matched_booking_id.slice(-6)}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <PlateScanStatusBadge status={scan.status} />
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