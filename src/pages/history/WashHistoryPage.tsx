import { CircleDollarSign, History, SearchX, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { WashHistoryFiltersPanel } from '../../components/history/WashHistoryFilters'
import { WashHistoryTable } from '../../components/history/WashHistoryTable'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { useAuth } from '../../contexts/AuthContext'
import { useBookings } from '../../contexts/BookingContext'
import { useInitialPageSkeleton } from '../../hooks/useInitialPageSkeleton'
import { formatPrice } from '../../utils/format'
import {
  DEFAULT_WASH_HISTORY_FILTERS,
  filterWashHistories,
  getWashHistoryStats,
  type WashHistoryFilters,
} from '../../utils/washHistoryFilters'

export function WashHistoryPage() {
  const { session } = useAuth()
  const { washHistories } = useBookings()
  const [filters, setFilters] = useState<WashHistoryFilters>(
    DEFAULT_WASH_HISTORY_FILTERS,
  )
  const isLoading = useInitialPageSkeleton(280)

  const garageId = session?.staffProfile.garage_id

  const filteredHistories = useMemo(
    () => filterWashHistories(washHistories, filters, garageId),
    [washHistories, filters, garageId],
  )

  const stats = useMemo(
    () => getWashHistoryStats(filteredHistories),
    [filteredHistories],
  )

  const hasActiveFilters =
    filters.date !== DEFAULT_WASH_HISTORY_FILTERS.date ||
    filters.licensePlate !== DEFAULT_WASH_HISTORY_FILTERS.licensePlate ||
    filters.query !== DEFAULT_WASH_HISTORY_FILTERS.query

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
      <PageHeader
        title="Lịch sử rửa"
        description="Xem lịch sử rửa xe read-only của garage đang làm việc."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Lượt rửa</p>
              <p className="text-2xl font-semibold text-slate-900">
                {stats.totalRecords}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Doanh thu (đã lọc)</p>
              <p className="text-lg font-semibold text-slate-900">
                {formatPrice(stats.totalRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Điểm loyalty cộng</p>
              <p className="text-2xl font-semibold text-slate-900">
                {stats.totalPoints}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <WashHistoryFiltersPanel
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_WASH_HISTORY_FILTERS)}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>
            {filteredHistories.length} bản ghi
            {hasActiveFilters ? ' (đã lọc)' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <WashHistoryTable
            histories={filteredHistories}
            emptyState={{
              icon: hasActiveFilters ? SearchX : History,
              title: hasActiveFilters
                ? 'Không có bản ghi phù hợp'
                : 'Chưa có lịch sử rửa',
              description: hasActiveFilters
                ? 'Thử đổi ngày, biển số hoặc từ khóa tìm kiếm.'
                : 'Lịch sử sẽ xuất hiện sau khi hoàn thành và thu tiền booking.',
            }}
          />
        </CardContent>
      </Card>
        </>
      )}
    </div>
  )
}
