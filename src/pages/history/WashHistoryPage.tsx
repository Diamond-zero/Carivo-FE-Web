import { CircleDollarSign, History, Loader2, RefreshCw, SearchX, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { WashHistoryDetailModal } from '../../components/history/WashHistoryDetailModal'
import { WashHistoryFiltersPanel } from '../../components/history/WashHistoryFilters'
import { WashHistoryTable } from '../../components/history/WashHistoryTable'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { StatCard } from '../../components/ui/StatCard'
import { useAuth } from '../../contexts/AuthContext'
import { useBookings } from '../../contexts/BookingContext'
import { useInitialPageSkeleton } from '../../hooks/useInitialPageSkeleton'
import type { WashHistory } from '../../types/washHistory'
import { formatPrice } from '../../utils/format'
import {
  DEFAULT_WASH_HISTORY_FILTERS,
  filterWashHistories,
  getWashHistoryStats,
  type WashHistoryFilters,
} from '../../utils/washHistoryFilters'

export function WashHistoryPage() {
  const { session } = useAuth()
  const {
    washHistories,
    isLoadingWashHistories,
    isWashHistoriesError,
    washHistoriesError,
    refetchWashHistories,
  } = useBookings()
  const [filters, setFilters] = useState<WashHistoryFilters>(
    DEFAULT_WASH_HISTORY_FILTERS,
  )
  const [selectedHistory, setSelectedHistory] = useState<WashHistory | null>(
    null,
  )
  const isInitialLoading = useInitialPageSkeleton(280)

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

  const isPageLoading = isInitialLoading || isLoadingWashHistories

  return (
    <div>
      {isPageLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            title="Lịch sử rửa"
            description="Dữ liệu từ GET /admin/wash-histories — bấm Booking để xem vận hành, Chi tiết để xem bản ghi đã rửa."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void refetchWashHistories()}
                disabled={isLoadingWashHistories}
              >
                {isLoadingWashHistories ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Làm mới
              </Button>
            }
          />

          {isWashHistoriesError ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {washHistoriesError}
            </div>
          ) : null}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Lượt rửa"
              value={stats.totalRecords}
              icon={History}
              accent="brand"
            />
            <StatCard
              label="Doanh thu (đã lọc)"
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
                onViewDetail={setSelectedHistory}
                emptyState={{
                  icon: hasActiveFilters ? SearchX : History,
                  title: hasActiveFilters
                    ? 'Không có bản ghi phù hợp'
                    : isWashHistoriesError
                      ? 'Không tải được lịch sử rửa'
                      : 'Chưa có lịch sử rửa',
                  description: hasActiveFilters
                    ? 'Thử đổi ngày, biển số hoặc từ khóa tìm kiếm.'
                    : isWashHistoriesError
                      ? 'Kiểm tra quyền Staff hoặc thử làm mới trang.'
                      : 'Lịch sử xuất hiện sau khi hoàn thành và thu tiền booking.',
                }}
              />
            </CardContent>
          </Card>

          <WashHistoryDetailModal
            open={Boolean(selectedHistory)}
            history={selectedHistory}
            onClose={() => setSelectedHistory(null)}
          />
        </>
      )}
    </div>
  )
}
