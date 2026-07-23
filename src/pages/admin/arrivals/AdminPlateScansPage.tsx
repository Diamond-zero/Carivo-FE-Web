import {
  Calendar,
  Camera as CameraIcon,
  Clock,
  Filter,
  ListChecks,
  Loader2,
  RefreshCw,
  ScanSearch,
  ScanLine,
  Search,
  SearchX,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import {
  PLATE_CAPTURE_SOURCE_LABELS,
  PLATE_SCAN_MODE_LABELS,
  PLATE_SCAN_STATUS_LABELS,
  PLATE_SCAN_STATUS_VARIANT,
} from '../../../api/plateScan.api'
import type { PlateScanStatus } from '../../../types/api/plateScan'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { Select } from '../../../components/ui/Select'
import { StatCard } from '../../../components/ui/StatCard'
import { useAdminGarageOptions } from '../../../hooks/api/admin/useAdminGarages'
import {
  useAdminPlateScans,
} from '../../../hooks/api/staff/useStaffPlateScans'
import type { ApiPlateScan } from '../../../types/api/plateScan'
import { formatDateTime } from '../../../utils/format'

const STATUS_FILTER_OPTIONS: Array<{ value: 'ALL' | PlateScanStatus; label: string }> = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'CAPTURED', label: PLATE_SCAN_STATUS_LABELS.CAPTURED },
  { value: 'RECOGNIZING', label: PLATE_SCAN_STATUS_LABELS.RECOGNIZING },
  { value: 'EXACT_MATCH', label: PLATE_SCAN_STATUS_LABELS.EXACT_MATCH },
  { value: 'FUZZY_CANDIDATES', label: PLATE_SCAN_STATUS_LABELS.FUZZY_CANDIDATES },
  { value: 'AMBIGUOUS', label: PLATE_SCAN_STATUS_LABELS.AMBIGUOUS },
  { value: 'NO_MATCH', label: PLATE_SCAN_STATUS_LABELS.NO_MATCH },
  { value: 'MULTIPLE_PLATES', label: PLATE_SCAN_STATUS_LABELS.MULTIPLE_PLATES },
  { value: 'ARRIVAL_DETECTED', label: PLATE_SCAN_STATUS_LABELS.ARRIVAL_DETECTED },
  { value: 'CONFIRMED', label: PLATE_SCAN_STATUS_LABELS.CONFIRMED },
  { value: 'REJECTED', label: PLATE_SCAN_STATUS_LABELS.REJECTED },
  { value: 'EXPIRED', label: PLATE_SCAN_STATUS_LABELS.EXPIRED },
  { value: 'FAILED', label: PLATE_SCAN_STATUS_LABELS.FAILED },
]

const PAGE_SIZE = 20

interface GarageLike {
  id: string
  name: string
}

export function AdminPlateScansPage() {
  const garages = (useAdminGarageOptions() as unknown) as GarageLike[]
  const [statusFilter, setStatusFilter] = useState<'ALL' | PlateScanStatus>('ALL')
  const [garageFilter, setGarageFilter] = useState('ALL')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const apiParams = useMemo(() => {
    const params: {
      status?: PlateScanStatus
      garage_id?: string
      from?: string
      to?: string
      page: number
      limit: number
    } = { page, limit: PAGE_SIZE }
    if (statusFilter !== 'ALL') params.status = statusFilter
    if (garageFilter !== 'ALL') params.garage_id = garageFilter
    if (from) {
      params.from = new Date(`${from}T00:00:00`).toISOString()
    }
    if (to) {
      params.to = new Date(`${to}T23:59:59`).toISOString()
    }
    return params
  }, [statusFilter, garageFilter, from, to, page])

  const query = useAdminPlateScans(apiParams)
  const rawData = query.data as unknown as { data?: ApiPlateScan[]; meta?: { total_pages: number } } | undefined
  const allScans = rawData?.data ?? []
  const totalPages = rawData?.meta?.total_pages ?? 1

  const filteredScans = useMemo(() => {
    const trimmed = search.trim().toLowerCase()
    if (!trimmed) return allScans
    return allScans.filter((scan) =>
      [
        scan.normalized_plate ?? '',
        scan.raw_plate_text ?? '',
        scan.id,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(trimmed)),
    )
  }, [allScans, search])

  const summary = useMemo(() => {
    const total = allScans.length
    const confirmed = allScans.filter((s: ApiPlateScan) => s.status === 'CONFIRMED').length
    const rejected = allScans.filter((s: ApiPlateScan) => s.status === 'REJECTED').length
    const pending = allScans.filter((s: ApiPlateScan) =>
      [
        'CAPTURED',
        'RECOGNIZING',
        'EXACT_MATCH',
        'FUZZY_CANDIDATES',
        'AMBIGUOUS',
        'NO_MATCH',
        'MULTIPLE_PLATES',
        'ARRIVAL_DETECTED',
      ].includes(s.status),
    ).length
    return { total, confirmed, rejected, pending }
  }, [allScans])

  if (query.isLoading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vận hành cổng"
        title="Lượt quét biển số"
        description="Tất cả lượt quét biển số cross-garage — staff, gate camera, retry. Lọc theo trạng thái, garage hoặc khoảng thời gian."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => void query.refetch()} disabled={query.isFetching}>
              {query.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Làm mới
            </Button>
            <Link to="/admin/arrivals/metrics">
              <Button>
                <ScanLine className="h-4 w-4" />
                Mở metrics
              </Button>
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng lượt quét" value={summary.total} icon={ListChecks} accent="brand" />
        <StatCard label="Đã check-in" value={summary.confirmed} icon={ScanSearch} accent="emerald" />
        <StatCard label="Đang chờ xử lý" value={summary.pending} icon={Clock} accent="amber" />
        <StatCard label="Đã từ chối" value={summary.rejected} icon={SearchX} accent="rose" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label htmlFor="status" className="mb-1.5">
                Trạng thái
              </Label>
              <Select
                id="status"
                value={statusFilter}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                  setPage(1)
                  setStatusFilter(event.target.value as 'ALL' | PlateScanStatus)
                }}
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="garage" className="mb-1.5">
                Garage
              </Label>
              <Select
                id="garage"
                value={garageFilter}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                  setPage(1)
                  setGarageFilter(event.target.value)
                }}
              >
                <option value="ALL">Tất cả garage</option>
                {garages.map((garage) => (
                  <option key={garage.id} value={garage.id}>
                    {garage.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="from" className="mb-1.5">
                Từ ngày
              </Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setPage(1)
                  setFrom(event.target.value)
                }}
              />
            </div>
            <div>
              <Label htmlFor="to" className="mb-1.5">
                Đến ngày
              </Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setPage(1)
                  setTo(event.target.value)
                }}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setStatusFilter('ALL')
                  setGarageFilter('ALL')
                  setFrom('')
                  setTo('')
                  setSearch('')
                  setPage(1)
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4" />
                Xóa lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {query.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(query.error, 'Không thể tải danh sách scan.')}
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>
            {filteredScans.length} / {allScans.length} lượt quét
          </CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
              placeholder="Tìm theo biển số hoặc ID..."
              className="w-full rounded-full border border-slate-200 bg-white py-1.5 pl-9 pr-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {filteredScans.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Không có lượt quét nào"
              description="Thử đổi bộ lọc hoặc chờ camera đẩy scan mới."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Scan ID</th>
                    <th className="px-4 py-3">Biển số</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Match</th>
                    <th className="px-4 py-3">Confidence</th>
                    <th className="px-4 py-3">Mode / Source</th>
                    <th className="px-4 py-3">Captured at</th>
                    <th className="px-4 py-3">Alternate</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredScans.map((scan: ApiPlateScan, index: number) => (
                    <ScanRow key={scan.id} scan={scan} striped={index % 2 === 1} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <span>
              Trang {page} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Trước
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  )
}

interface ScanRowProps {
  scan: ApiPlateScan
  striped: boolean
}

function ScanRow({ scan, striped }: ScanRowProps) {
  const variant = PLATE_SCAN_STATUS_VARIANT[scan.status]
  const variantClass: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
    info: 'bg-sky-50 text-sky-700',
  }
  return (
    <tr className={`hover:bg-slate-50/60 ${striped ? 'bg-slate-50/50' : ''}`}>
      <td className="px-4 py-3">
        <Link
          to={`/admin/arrivals/scans/${scan.id}`}
          className="font-mono text-xs font-semibold text-brand-700 hover:underline"
        >
          {scan.id.replace(/^.*-/, '#')}
        </Link>
      </td>
      <td className="px-4 py-3">
        <p className="font-mono text-sm font-bold uppercase text-slate-900">
          {scan.normalized_plate ?? '—'}
        </p>
        {scan.raw_plate_text && scan.raw_plate_text !== scan.normalized_plate ? (
          <p className="text-xs text-slate-500">raw: {scan.raw_plate_text}</p>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClass[variant]}`}
        >
          {PLATE_SCAN_STATUS_LABELS[scan.status]}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs font-medium text-slate-700">{scan.match_type}</span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-xs font-semibold ${
            scan.confidence >= 0.85
              ? 'text-emerald-700'
              : scan.confidence >= 0.6
                ? 'text-amber-700'
                : 'text-rose-700'
          }`}
        >
          {(scan.confidence * 100).toFixed(1)}%
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-slate-700">{PLATE_SCAN_MODE_LABELS[scan.mode]}</p>
        <p className="text-[11px] text-slate-500">
          {PLATE_CAPTURE_SOURCE_LABELS[scan.capture_source]}
        </p>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {scan.captured_at ? (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDateTime(scan.captured_at)}
          </div>
        ) : (
          '—'
        )}
        {scan.camera_device_id ? (
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <CameraIcon className="h-3 w-3" /> từ camera
          </div>
        ) : null}
      </td>
      <td className="px-4 py-3">
        {scan.alternate_vehicle_status !== 'NONE' ? (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              scan.alternate_vehicle_status === 'REQUESTED'
                ? 'bg-amber-50 text-amber-800'
                : scan.alternate_vehicle_status === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
            }`}
          >
            {scan.alternate_vehicle_status}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <Link to={`/admin/arrivals/scans/${scan.id}`}>
          <Button variant="secondary" size="sm">
            <ScanSearch className="h-3.5 w-3.5" />
            Chi tiết
          </Button>
        </Link>
      </td>
    </tr>
  )
}
