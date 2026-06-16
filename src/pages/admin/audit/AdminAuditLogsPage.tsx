import { ScrollText, Shield, UserCog } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AdminAuditLogDetailModal } from '../../../components/admin/audit/AdminAuditLogDetailModal'
import { AdminAuditLogFiltersPanel } from '../../../components/admin/audit/AdminAuditLogFiltersPanel'
import { AdminAuditLogListTable } from '../../../components/admin/audit/AdminAuditLogListTable'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useInitialPageSkeleton } from '../../../hooks/useInitialPageSkeleton'
import { mockAdminAuditLogs } from '../../../mocks/admin/auditLogs'
import {
  DEFAULT_ADMIN_AUDIT_LOG_FILTERS,
  getAdminAuditLogById,
  hasActiveAdminAuditLogFilters,
  searchAdminAuditLogs,
  type AdminAuditLogFilters,
} from '../../../utils/adminAuditLogLookup'

export function AdminAuditLogsPage() {
  const [filters, setFilters] = useState<AdminAuditLogFilters>(
    DEFAULT_ADMIN_AUDIT_LOG_FILTERS,
  )
  const [detailLogId, setDetailLogId] = useState<string | null>(null)
  const isLoading = useInitialPageSkeleton(280)

  const logs = useMemo(() => searchAdminAuditLogs(filters), [filters])
  const adminCount = mockAdminAuditLogs.filter((log) => log.actor_role === 'ADMIN').length
  const staffCount = mockAdminAuditLogs.length - adminCount
  const exportCount = mockAdminAuditLogs.filter((log) => log.action === 'EXPORT').length
  const hasActiveFilter = hasActiveAdminAuditLogFilters(filters)
  const detailLog = detailLogId ? getAdminAuditLogById(detailLogId) ?? null : null

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Admin"
            title="Audit Logs"
            description="Nhật ký thao tác quản trị trên hệ thống — read-only, xem chi tiết old/new value."
          />

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Tổng log"
              value={mockAdminAuditLogs.length}
              icon={ScrollText}
              accent="brand"
            />
            <StatCard
              label="Admin / Staff"
              value={`${adminCount} / ${staffCount}`}
              icon={UserCog}
              accent="violet"
            />
            <StatCard
              label="Export actions"
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
                {logs.length} audit log
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
