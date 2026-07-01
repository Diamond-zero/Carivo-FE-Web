import { CircleDollarSign, History, Loader2, RefreshCw, SearchX, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { WashHistoryDetailModal } from '../../components/history/WashHistoryDetailModal'
import { WashHistoryFiltersPanel } from '../../components/history/WashHistoryFilters'
import { WashHistoryTable } from '../../components/history/WashHistoryTable'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { StatCard } from '../../components/ui/StatCard'
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

  const filteredHistories = useMemo(
    () => filterWashHistories(washHistories, filters),
    [washHistories, filters],
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
    <div className="space-y-6">
      {isPageLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            title="Lịch sử rửa"
            description="Lịch sử rửa tại garage của bạn. Bấm Booking để xem vận hành, Chi tiết để xem bản ghi đã rửa."
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
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {washHistoriesError}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Lượt rửa"
              value={stats.totalRecords}
              icon={History}
              accent="brand"
              hint={hasActiveFilters ? 'Theo bộ lọc hiện tại' : 'Tổng tất cả'}
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

          <WashHistoryFiltersPanel
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(DEFAULT_WASH_HISTORY_FILTERS)}
          />

          <Card className="border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">
                  {filteredHistories.length}
                </span>{' '}
                bản ghi{hasActiveFilters ? ' (đã lọc)' : ''}
              </p>
            </div>
            <CardContent className="p-0 pb-2">
              <WashHistoryTable
                histories={filteredHistories}
                onViewDetail={setSelectedHistory}
                showBookingColumn={false}
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
            bookingLinkPrefix="/bookings/"
          />
        </>
      )}
    </div>
  )
}

