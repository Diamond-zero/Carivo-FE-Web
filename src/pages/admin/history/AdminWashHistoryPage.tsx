import { CircleDollarSign, History, Loader2, RefreshCw, SearchX, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../../api/client'
import { WashHistoryDetailModal } from '../../../components/history/WashHistoryDetailModal'
import { WashHistoryFiltersPanel } from '../../../components/history/WashHistoryFilters'
import { WashHistoryTable } from '../../../components/history/WashHistoryTable'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminWashHistories } from '../../../hooks/api/admin/useAdminWashHistories'
import type { WashHistory } from '../../../types/washHistory'
import { formatPrice } from '../../../utils/format'
import {
  DEFAULT_WASH_HISTORY_FILTERS,
  filterWashHistories,
  getWashHistoryStats,
  type WashHistoryFilters,
} from '../../../utils/washHistoryFilters'

export function AdminWashHistoryPage() {
  const { showToast } = useToast()
  const [filters, setFilters] = useState<WashHistoryFilters>(DEFAULT_WASH_HISTORY_FILTERS)
  const [selectedHistory, setSelectedHistory] = useState<WashHistory | null>(null)

  const { data, isLoading, isError, error, refetch, isFetching } = useAdminWashHistories()

  const histories = data?.histories ?? []

  const filteredHistories = useMemo(
    () => filterWashHistories(histories, filters),
    [histories, filters],
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

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Quản trị"
            title="Lịch sử rửa"
            description="Xem toàn bộ lịch sử rửa trên hệ thống."
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
            <StatCard label="Lượt rửa" value={stats.totalRecords} icon={History} accent="brand" />
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
            <CardHeader>
              <CardTitle>
                {filteredHistories.length} bản ghi
                {hasActiveFilters ? ' (đã lọc)' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <WashHistoryTable
                histories={filteredHistories}
                onViewDetail={setSelectedHistory}
                bookingLinkPrefix="/admin/bookings/"
                emptyState={{
                  icon: hasActiveFilters ? SearchX : History,
                  title: hasActiveFilters ? 'Không có bản ghi phù hợp' : 'Chưa có lịch sử rửa',
                  description: hasActiveFilters
                    ? 'Thử đổi ngày, biển số hoặc từ khóa tìm kiếm.'
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
