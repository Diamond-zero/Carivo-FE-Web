import { useEffect, useMemo, useState } from 'react'
import { ScrollText, Shield, UserCog } from 'lucide-react'
import { getApiErrorMessage } from '../../../api/client'
import { AdminAuditLogDetailModal } from '../../../components/admin/audit/AdminAuditLogDetailModal'
import { AdminAuditLogFiltersPanel } from '../../../components/admin/audit/AdminAuditLogFiltersPanel'
import { AdminAuditLogListTable } from '../../../components/admin/audit/AdminAuditLogListTable'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminAuditLogs } from '../../../hooks/api/admin/useAdminAuditLogs'
import {
  DEFAULT_ADMIN_AUDIT_LOG_FILTERS,
  getAdminAuditLogById,
  hasActiveAdminAuditLogFilters,
  searchAdminAuditLogs,
  type AdminAuditLogFilters,
} from '../../../utils/adminAuditLogLookup'

export function AdminAuditLogsPage() {
  const { showToast } = useToast()
  const [filters, setFilters] = useState<AdminAuditLogFilters>(
    DEFAULT_ADMIN_AUDIT_LOG_FILTERS,
  )
  const [detailLogId, setDetailLogId] = useState<string | null>(null)
  const { data, isLoading, isError, error } = useAdminAuditLogs()

  const allLogs = data?.logs ?? []
  const logs = useMemo(() => searchAdminAuditLogs(filters, allLogs), [filters, allLogs])
  const adminCount = allLogs.filter((log) => log.actor_role === 'ADMIN').length
  const staffCount = allLogs.length - adminCount
  const exportCount = allLogs.filter((log) => log.action === 'EXPORT').length
  const hasActiveFilter = hasActiveAdminAuditLogFilters(filters)
  const detailLog = detailLogId ? getAdminAuditLogById(detailLogId, allLogs) ?? null : null

  useEffect(() => {
    if (isError) {
      showToast(getApiErrorMessage(error, 'Không tải được nhật ký hệ thống.'), 'error')
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
            title="Nhật ký hệ thống"
            description="Nhật ký thao tác quản trị trên hệ thống — chỉ xem, xem chi tiết giá trị cũ/mới."
          />

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Tổng nhật ký"
              value={allLogs.length}
              icon={ScrollText}
              accent="brand"
            />
            <StatCard
              label="Quản trị / Nhân viên"
              value={`${adminCount} / ${staffCount}`}
              icon={UserCog}
              accent="violet"
            />
            <StatCard
              label="Thao tác xuất dữ liệu"
              value={exportCount}
              icon={Shield}
              accent="emerald"
            />
          </div>

          <div className="mb-6">
            <AdminAuditLogFiltersPanel
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(DEFAULT_ADMIN_AUDIT_LOG_FILTERS)}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {logs.length} nhật ký
                {hasActiveFilter ? ' (đã lọc)' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <AdminAuditLogListTable
                logs={logs}
                hasActiveFilter={hasActiveFilter}
                onViewDetail={setDetailLogId}
              />
            </CardContent>
          </Card>

          <AdminAuditLogDetailModal
            log={detailLog}
            onClose={() => setDetailLogId(null)}
          />
        </>
      )}
    </div>
  )
}
