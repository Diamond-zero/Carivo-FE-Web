import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ScrollText,
  Shield,
  ShieldCheck,
  UserCog,
} from 'lucide-react'
import { getApiErrorMessage } from '../../../api/client'
import { AdminAuditLogDetailModal } from '../../../components/admin/audit/AdminAuditLogDetailModal'
import { AdminAuditLogFiltersPanel } from '../../../components/admin/audit/AdminAuditLogFiltersPanel'
import { AdminAuditLogListTable } from '../../../components/admin/audit/AdminAuditLogListTable'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminAuditLogs } from '../../../hooks/api/admin/useAdminAuditLogs'
import {
  DEFAULT_ADMIN_AUDIT_LOG_FILTERS,
  adminAuditLogFiltersToParams,
  getAdminAuditLogActorRole,
  hasActiveAdminAuditLogFilters,
} from '../../../utils/adminAuditLogLookup'
import { cn } from '../../../lib/utils'
import type { AuditLog } from '../../../types/auditLog'
import type { AuditLogListParams } from '../../../api/auditLog.api'

export function AdminAuditLogsPage() {
  const { showToast } = useToast()
  const [filters, setFilters] = useState(DEFAULT_ADMIN_AUDIT_LOG_FILTERS)
  const [detailLogId, setDetailLogId] = useState<string | null>(null)

  const apiParams = useMemo<AuditLogListParams | undefined>(
    () => {
      const params = adminAuditLogFiltersToParams(filters)
      return Object.keys(params).length > 0 ? params : undefined
    },
    [filters],
  )

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useAdminAuditLogs(apiParams)

  const dataResult = data
  const allLogs = useMemo(() => dataResult?.logs ?? [], [dataResult])
  const meta = dataResult?.meta ?? {
    page: filters.page,
    limit: filters.limit,
    total: 0,
    total_pages: 1,
  }
  const totalPages = Math.max(meta.total_pages ?? 1, 1)
  const hasActiveFilter = hasActiveAdminAuditLogFilters(filters)

  const stats = useMemo(() => {
    let admin = 0
    let staff = 0
    let other = 0
    let exportCount = 0
    let deleteCount = 0
    for (const log of allLogs) {
      const role = getAdminAuditLogActorRole(log)
      if (role === 'ADMIN') admin += 1
      else if (role === 'STAFF') staff += 1
      else other += 1
      if (log.action.toUpperCase() === 'EXPORT') exportCount += 1
      if (log.action.toUpperCase().includes('DELETE')) deleteCount += 1
    }
    return { admin, staff, other, exportCount, deleteCount }
  }, [allLogs])

  const detailLog: AuditLog | null = useMemo(() => {
    if (!detailLogId) return null
    return allLogs.find((log) => log.id === detailLogId) ?? null
  }, [detailLogId, allLogs])

  useEffect(() => {
    if (!isError) return
    showToast(
      getApiErrorMessage(error, 'Không tải được nhật ký hệ thống.'),
      'error',
    )
  }, [isError, error, showToast])

  const handleRefresh = async () => {
    try {
      await refetch()
      showToast('Đã làm mới nhật ký hệ thống.', 'success')
    } catch (refreshError) {
      showToast(
        getApiErrorMessage(refreshError, 'Không làm mới được nhật ký.'),
        'error',
      )
    }
  }

  const goToPage = (nextPage: number) => {
    setFilters((prev) => ({ ...prev, page: nextPage }))
  }

  const updateFilters = (next: typeof filters) => {
    // Khi user đổi bất kỳ filter nào ngoài page thì về trang 1.
    if (
      next.action !== filters.action ||
      next.resourceType !== filters.resourceType ||
      next.actorRole !== filters.actorRole ||
      next.query !== filters.query ||
      next.dateFrom !== filters.dateFrom ||
      next.dateTo !== filters.dateTo
    ) {
      setFilters({ ...next, page: 1 })
    } else {
      setFilters(next)
    }
  }

  const resetFilters = () => setFilters(DEFAULT_ADMIN_AUDIT_LOG_FILTERS)

  const isFirstLoad = isLoading && !data

  if (isFirstLoad) {
    return <DashboardPageSkeleton />
  }

  const displayedTotal = meta.total ?? allLogs.length
  const startIndex = displayedTotal === 0 ? 0 : (filters.page - 1) * filters.limit + 1
  const endIndex = Math.min(
    (filters.page - 1) * filters.limit + allLogs.length,
    displayedTotal,
  )

  return (
    <div className="space-y-6 carivo-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Carivo Quản trị"
          title="Nhật ký hệ thống"
          description="Theo dõi thao tác quản trị trên hệ thống — chỉ xem, mở chi tiết để đối chiếu giá trị cũ/mới."
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw
            className={cn(
              'h-4 w-4 transition-transform',
              isFetching && 'animate-spin',
            )}
          />
          {isFetching ? 'Đang làm mới…' : 'Làm mới'}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng nhật ký"
          value={displayedTotal}
          icon={ScrollText}
          accent="brand"
        />
        <StatCard
          label="Quản trị / Nhân viên"
          value={`${stats.admin} / ${stats.staff}`}
          hint={`Hệ thống: ${stats.other}`}
          icon={UserCog}
          accent="violet"
        />
        <StatCard
          label="Thao tác xuất dữ liệu"
          value={stats.exportCount}
          icon={Shield}
          accent="emerald"
        />
        <StatCard
          label="Thao tác xoá / lưu trữ"
          value={stats.deleteCount}
          icon={Activity}
          accent="rose"
        />
      </div>

      <AdminAuditLogFiltersPanel
        filters={filters}
        onChange={updateFilters}
        onReset={resetFilters}
        isLoading={isFetching}
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
            {displayedTotal} nhật ký
            {hasActiveFilter ? (
              <span className="ml-1 text-xs font-medium text-brand-600">
                (đã lọc)
              </span>
            ) : null}
          </CardTitle>
          <span className="text-xs text-slate-500">
            Trang {filters.page}/{totalPages} · {displayedTotal} bản ghi
          </span>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <AdminAuditLogListTable
            logs={allLogs}
            hasActiveFilter={hasActiveFilter}
            onViewDetail={setDetailLogId}
            isRefreshing={isFetching}
          />
        </CardContent>
      </Card>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-[var(--shadow-carivo-sm)]">
          <span className="text-xs text-slate-500">
            Hiển thị {startIndex} – {endIndex} / {displayedTotal} bản ghi
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(Math.max(1, filters.page - 1))}
              disabled={filters.page <= 1 || isFetching}
            >
              <ChevronLeft className="h-4 w-4" />
              Trang trước
            </Button>
            <span className="text-sm font-medium text-slate-700">
              {filters.page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(Math.min(totalPages, filters.page + 1))}
              disabled={filters.page >= totalPages || isFetching}
            >
              Trang sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <AdminAuditLogDetailModal
        log={detailLog}
        onClose={() => setDetailLogId(null)}
      />
    </div>
  )
}