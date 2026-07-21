import { ArrowRight, Camera, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../api/client'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Label } from '../../components/ui/Label'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../contexts/ToastContext'
import {
  useStaffArrivalQueue,
  useStaffPlateScans,
  useRecognizePlateMutation,
} from '../../hooks/api/staff/useStaffPlateScans'
import { uploadFileApi } from '../../api/upload.api'
import { formatDateTime } from '../../utils/format'

export function StaffArrivalQueuePage() {
  const { showToast } = useToast()
  const [frameUrls, setFrameUrls] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const queueQuery = useStaffArrivalQueue()
  const scansQuery = useStaffPlateScans()
  const recognizeMutation = useRecognizePlateMutation()

  const queue = queueQuery.data ?? []
  const recentScans = scansQuery.data?.data ?? []

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const upload = await uploadFileApi(file, { purpose: 'GENERAL' })
      setFrameUrls((current) => {
        const trimmed = current.trim()
        if (!trimmed) return upload.url
        return `${trimmed}\n${upload.url}`
      })
      showToast('Đã upload ảnh. Bạn có thể upload thêm hoặc nhấn "Nhận diện".', 'success')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể upload ảnh.'), 'error')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleRecognize = async () => {
    const urls = frameUrls
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    if (urls.length === 0) {
      showToast('Vui lòng upload ít nhất một ảnh biển số.', 'error')
      return
    }
    try {
      await recognizeMutation.mutateAsync({
        frame_upload_ids: urls,
      })
      showToast('Đã gửi ảnh nhận diện. Hệ thống sẽ xử lý trong giây lát.', 'success')
      setFrameUrls('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể nhận diện.'), 'error')
    }
  }

  if (queueQuery.isLoading && scansQuery.isLoading) return <DashboardPageSkeleton />

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
            {queue.length === 0 ? (
              <EmptyState
                icon={Camera}
                title="Chưa có xe đến"
                description="Khi camera cổng nhận diện được biển số, lượt quét sẽ xuất hiện ở đây để staff xác nhận."
              />
            ) : (
              <ul className="space-y-2">
                {queue.map((item) => (
                  <li
                    key={item.scan_id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                  >
                    <div>
                      <p className="font-mono text-base font-bold text-slate-900">
                        {item.detected_plate ?? '?'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Độ khớp:{' '}
                        {item.best_confidence
                          ? `${(item.best_confidence * 100).toFixed(0)}%`
                          : '—'}
                      </p>
                      {item.captured_at ? (
                        <p className="text-xs text-slate-500">
                          Lúc {formatDateTime(item.captured_at)}
                        </p>
                      ) : null}
                    </div>
                    <Link to={`/staff/arrivals/${item.scan_id}`}>
                      <Button size="sm" variant="secondary">
                        <ArrowRight className="h-4 w-4" />
                        Mở
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
            <CardTitle className="text-base">Upload ảnh nhận diện thủ công</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Upload ảnh chụp biển số (1 hoặc nhiều ảnh) để BE nhận diện và đối chiếu
              với booking trong ngày.
            </p>
            <div>
              <Label htmlFor="frame-upload">Ảnh biển số</Label>
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
            <div>
              <Label htmlFor="frame-urls">URLs sau upload (mỗi dòng một URL)</Label>
              <textarea
                id="frame-urls"
                rows={4}
                className="min-h-[100px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                placeholder="https://cdn.carivo.vn/uploads/abc.jpg"
                value={frameUrls}
                onChange={(event) => setFrameUrls(event.target.value)}
              />
            </div>
            <Button
              onClick={handleRecognize}
              disabled={recognizeMutation.isPending || isUploading}
            >
              {recognizeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Gửi nhận diện
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Lịch sử quét gần đây</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {recentScans.length === 0 ? (
            <p className="px-6 py-4 text-sm text-slate-500">Chưa có lượt quét nào.</p>
          ) : (
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Biển số</th>
                  <th className="px-6 py-3">Độ khớp</th>
                  <th className="px-6 py-3">Booking khớp</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {scan.detected_plate ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {scan.best_confidence
                        ? `${(scan.best_confidence * 100).toFixed(0)}%`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {scan.matched_booking_id ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge>{scan.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {scan.captured_at ? formatDateTime(scan.captured_at) : '—'}
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