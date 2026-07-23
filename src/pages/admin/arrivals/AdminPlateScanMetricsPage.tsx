import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Filter,
  Gauge,
  Hash,
  PieChart as PieChartIcon,
  RefreshCw,
  ScanSearch,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getApiErrorMessage } from '../../../api/client'
import { PLATE_SCAN_STATUS_LABELS } from '../../../api/plateScan.api'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useAdminGarageOptions } from '../../../hooks/api/admin/useAdminGarages'
import { useAdminPlateScanMetrics } from '../../../hooks/api/staff/useStaffPlateScans'
import type {
  ApiPlateScanMetricDimension,
  ApiPlateScanQualityBucket,
  ApiPlateScanStatusBucket,
} from '../../../types/api/plateScan'

const STATUS_COLORS: Record<string, string> = {
  CAPTURED: '#0ea5e9',
  RECOGNIZING: '#38bdf8',
  EXACT_MATCH: '#10b981',
  FUZZY_CANDIDATES: '#f59e0b',
  AMBIGUOUS: '#f97316',
  NO_MATCH: '#ef4444',
  MULTIPLE_PLATES: '#dc2626',
  ARRIVAL_DETECTED: '#6366f1',
  CONFIRMED: '#16a34a',
  REJECTED: '#e11d48',
  EXPIRED: '#94a3b8',
  FAILED: '#be123c',
  QUALITY_REJECTED: '#fb923c',
}

const QUALITY_COLOR = '#f59e0b'

interface GarageLike {
  id: string
  name: string
}

export function AdminPlateScanMetricsPage() {
  const garages = (useAdminGarageOptions() as unknown) as GarageLike[]
  const [garageFilter, setGarageFilter] = useState('ALL')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const apiParams = useMemo(() => {
    const params: { garage_id?: string; from?: string; to?: string } = {}
    if (garageFilter !== 'ALL') params.garage_id = garageFilter
    if (from) params.from = new Date(`${from}T00:00:00`).toISOString()
    if (to) params.to = new Date(`${to}T23:59:59`).toISOString()
    return params
  }, [garageFilter, from, to])

  const query = useAdminPlateScanMetrics(apiParams)

  if (query.isLoading) return <DashboardPageSkeleton />

  if (query.isError || !query.data) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Vận hành cổng"
          title="Metrics nhận diện biển số"
          description="Confidence trung bình, latency, retry, mismatch và quality dashboard."
        />
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(query.error, 'Không thể tải metrics.')}
        </div>
      </div>
    )
  }

  const metrics = query.data

  const byStatusData: Array<{ status: string; label: string; count: number }> =
    metrics.by_status.map((bucket: ApiPlateScanStatusBucket) => ({
      status: bucket.status,
      label: PLATE_SCAN_STATUS_LABELS[bucket.status],
      count: bucket.count,
    }))

  const qualityData: Array<{ flag: string; count: number }> = metrics.quality_flags.map(
    (bucket: ApiPlateScanQualityBucket) => ({
      flag: bucket.flag,
      count: bucket.count,
    }),
  )

  const dimensionRows = metrics.dimensions.slice(0, 12)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vận hành cổng"
        title="Metrics nhận diện biển số"
        description="Tổng hợp confidence, latency, retry, mismatch và quality — phục vụ tuning camera và nhận diện."
        action={
          <Button variant="secondary" onClick={() => void query.refetch()}>
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="garage" className="mb-1.5">
                Garage
              </Label>
              <select
                id="garage"
                value={garageFilter}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setGarageFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="ALL">Tất cả garage</option>
                {garages.map((garage) => (
                  <option key={garage.id} value={garage.id}>
                    {garage.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="from" className="mb-1.5">
                Từ ngày
              </Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFrom(event.target.value)}
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
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTo(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setGarageFilter('ALL')
                  setFrom('')
                  setTo('')
                }}
              >
                <Filter className="h-4 w-4" />
                Xóa lọc
              </Button>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <CalendarRange className="h-3 w-3" />
            Khoảng lọc đang áp dụng cho cả 4 nhóm chỉ số.
          </p>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng lượt quét"
          value={metrics.total}
          icon={ScanSearch}
          accent="brand"
        />
        <StatCard
          label="Avg confidence"
          value={`${(metrics.average_confidence * 100).toFixed(1)}%`}
          icon={Gauge}
          accent="indigo"
        />
        <StatCard
          label="Avg latency"
          value={`${Math.round(metrics.average_latency_ms)}ms`}
          icon={Activity}
          accent="violet"
        />
        <StatCard
          label="Confirmation rate"
          value={`${(metrics.confirmation_rate * 100).toFixed(1)}%`}
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          label="Retry rate"
          value={`${(metrics.retry_rate * 100).toFixed(1)}%`}
          icon={RefreshCw}
          accent="amber"
        />
        <StatCard
          label="Mismatch rate"
          value={`${(metrics.mismatch_rate * 100).toFixed(1)}%`}
          icon={AlertTriangle}
          accent="rose"
        />
        <StatCard label="Retries" value={metrics.retries} icon={Hash} accent="amber" />
        <StatCard
          label="Mismatches"
          value={metrics.mismatches}
          icon={AlertTriangle}
          accent="rose"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="h-4 w-4" />
              Phân bố trạng thái
            </CardTitle>
          </CardHeader>
          <CardContent>
            {byStatusData.every((d) => d.count === 0) ? (
              <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                Chưa có dữ liệu trong khoảng lọc.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={byStatusData}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={50}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {byStatusData.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] ?? '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [value, name]} />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      wrapperStyle={{ fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Quality flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {qualityData.length === 0 ? (
              <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                Không có quality flag nào được ghi nhận.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={qualityData} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="flag"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      formatter={(value: number) => [value, 'Lượt quét']}
                      labelFormatter={(label: string) => `Flag: ${label}`}
                    />
                    <Bar dataKey="count" fill={QUALITY_COLOR} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Dimensions breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dimensionRows.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Chưa có dữ liệu breakdown.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Garage</th>
                    <th className="px-4 py-3">Loại xe</th>
                    <th className="px-4 py-3">Weather</th>
                    <th className="px-4 py-3">Time of day</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Avg confidence</th>
                    <th className="px-4 py-3 text-right">Avg latency (ms)</th>
                    <th className="px-4 py-3 text-right">Confirmed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dimensionRows.map((row: ApiPlateScanMetricDimension, idx: number) => (
                    <tr key={`${row.garage_id ?? 'g'}-${row.vehicle_type}-${idx}`} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        {row.garage_id?.replace(/^.*-/, '#') ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">{row.vehicle_type}</td>
                      <td className="px-4 py-3 text-xs text-slate-700">{row.weather ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-700">{row.time_of_day ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-slate-900">
                        {row.total}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-700">
                        {(row.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-700">
                        {Math.round(row.latency_ms)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-emerald-700">
                        {row.confirmed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}