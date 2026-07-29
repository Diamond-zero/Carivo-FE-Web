import { CircleDollarSign, History, Loader2, RefreshCw, SearchX, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../../api/client'
import { WashHistoryDetailModal } from '../../../components/history/WashHistoryDetailModal'
import { WashHistoryFiltersPanel } from '../../../components/history/WashHistoryFilters'
import { WashHistoryTable } from '../../../components/history/WashHistoryTable'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { VEHICLE_TYPE_LABELS } from '../../../constants/washBayStatus'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminGarages } from '../../../hooks/api/admin/useAdminGarages'
import { useAdminServicePackages } from '../../../hooks/api/admin/useAdminServicePackages'
import {
  ADMIN_WASH_HISTORY_PAGE_SIZE,
  useAdminWashHistories,
} from '../../../hooks/api/admin/useAdminWashHistories'
import type { WashHistory } from '../../../types/washHistory'
import { formatPrice } from '../../../utils/format'
import {
  DEFAULT_WASH_HISTORY_FILTERS,
  filterWashHistories,
  getWashHistoryStats,
  type WashHistoryFilters,
} from '../../../utils/washHistoryFilters'

const VEHICLE_TYPE_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  ...Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
]

export function AdminWashHistoryPage() {
  const { showToast } = useToast()
  const [filters, setFilters] = useState<WashHistoryFilters>(DEFAULT_WASH_HISTORY_FILTERS)
  const [garageFilter, setGarageFilter] = useState<string>('ALL')
  const [servicePackageFilter, setServicePackageFilter] = useState<string>('ALL')
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('ALL')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [page, setPage] = useState(1)
  const [selectedHistory, setSelectedHistory] = useState<WashHistory | null>(null)

  const { allGarages } = useAdminGarages({})
  const { allPackages } = useAdminServicePackages({})

  const { data, isLoading, isError, error, refetch, isFetching } = useAdminWashHistories({
    garageId: garageFilter,
    servicePackageId:
      servicePackageFilter === 'ALL' ? undefined : servicePackageFilter,
    vehicleType:
      vehicleTypeFilter === 'ALL'
        ? undefined
        : (vehicleTypeFilter as 'MOTORBIKE' | 'CAR'),
    from: fromDate ? new Date(`${fromDate}T00:00:00`).toISOString() : undefined,
    to: toDate ? new Date(`${toDate}T23:59:59`).toISOString() : undefined,
    page,
    limit: ADMIN_WASH_HISTORY_PAGE_SIZE,
  })

  const histories = useMemo(() => data?.histories ?? [], [data?.histories])
  const meta = data?.meta
  const totalPages = meta?.total_pages ?? 1
  const total = meta?.total ?? histories.length

  const filteredHistories = useMemo(
    () =>
      filterWashHistories(
        histories,
        filters,
        garageFilter === 'ALL' ? undefined : garageFilter,
      ),
    [histories, filters, garageFilter],
  )

  const stats = useMemo(
    () => getWashHistoryStats(filteredHistories),
    [filteredHistories],
  )

  const hasActiveFilters =
    filters.date !== DEFAULT_WASH_HISTORY_FILTERS.date ||
    filters.licensePlate !== DEFAULT_WASH_HISTORY_FILTERS.licensePlate ||
    filters.query !== DEFAULT_WASH_HISTORY_FILTERS.query

  useEffect(() => {
    if (isError) {
      showToast(getApiErrorMessage(error, 'Không tải được lịch sử rửa.'), 'error')
    }
  }, [isError, error, showToast])

  useEffect(() => {
    setPage(1)
  }, [
    filters.date,
    filters.licensePlate,
    filters.query,
    garageFilter,
    servicePackageFilter,
    vehicleTypeFilter,
    fromDate,
    toDate,
  ])

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Quản trị"
            title="Lịch sử rửa"
            description="Xem toàn bộ lịch sử rửa — có thể lọc theo chi nhánh, gói dịch vụ và khoảng thời gian."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Làm mới
              </Button>
            }
          />

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Tổng bản ghi"
              value={total}
              icon={History}
              accent="brand"
            />
            <StatCard
              label="Doanh thu (trang này)"
              value={formatPrice(stats.totalRevenue)}
              icon={CircleDollarSign}
              accent="emerald"
            />
            <StatCard
              label="Điểm loyalty cộng"
              value={stats.totalPoints}
              icon={Sparkles}
              accent="violet"
            />
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <Label htmlFor="admin-wash-history-garage">Chi nhánh garage</Label>
              <Select
                id="admin-wash-history-garage"
                value={garageFilter}
                onChange={(event) => setGarageFilter(event.target.value)}
              >
                <option value="ALL">Tất cả garage</option>
                {allGarages.map((garage) => (
                  <option key={garage.id} value={garage.id}>
                    {garage.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="admin-wash-history-service-package">Gói dịch vụ</Label>
              <Select
                id="admin-wash-history-service-package"
                value={servicePackageFilter}
                onChange={(event) => setServicePackageFilter(event.target.value)}
              >
                <option value="ALL">Tất cả gói</option>
                {allPackages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="admin-wash-history-vehicle-type">Loại xe</Label>
              <Select
                id="admin-wash-history-vehicle-type"
                value={vehicleTypeFilter}
                onChange={(event) => setVehicleTypeFilter(event.target.value)}
              >
                {VEHICLE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="admin-wash-history-from">Từ ngày</Label>
              <Input
                id="admin-wash-history-from"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="admin-wash-history-to">Đến ngày</Label>
              <Input
                id="admin-wash-history-to"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>
          </div>

          <WashHistoryFiltersPanel
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(DEFAULT_WASH_HISTORY_FILTERS)}
          />

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>
                {filteredHistories.length} bản ghi
                {hasActiveFilters ? ' (đã lọc)' : ''}
                {meta ? ` · Trang ${meta.page}/${meta.total_pages}` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <WashHistoryTable
                histories={filteredHistories}
                onViewDetail={setSelectedHistory}
                bookingLinkPrefix="/admin/bookings/"
                emptyState={{
                  icon: hasActiveFilters ? SearchX : History,
                  title: hasActiveFilters
                    ? 'Không có bản ghi phù hợp'
                    : 'Chưa có lịch sử rửa',
                  description: hasActiveFilters
                    ? 'Thử đổi ngày, biển số hoặc từ khóa tìm kiếm.'
                    : 'Lịch sử xuất hiện sau khi hoàn thành và thu tiền booking.',
                }}
              />
            </CardContent>
            {meta && meta.total_pages > 1 ? (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-sm text-slate-600">
                <span>
                  Trang {meta.page} / {meta.total_pages} · {meta.total} bản ghi
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1 || isFetching}
                  >
                    Trước
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    disabled={page >= totalPages || isFetching}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>

          <WashHistoryDetailModal
            open={Boolean(selectedHistory)}
            history={selectedHistory}
            onClose={() => setSelectedHistory(null)}
            bookingLinkPrefix="/admin/bookings/"
          />
        </>
      )}
    </div>
  )
}
