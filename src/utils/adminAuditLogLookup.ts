import { mockAdminAuditLogs } from '../mocks/admin/auditLogs'
import type { AuditLog } from '../types/auditLog'
import { normalizeSearchText } from './booking'

export interface AdminAuditLogFilters {
  entity: string | 'ALL'
  action: string | 'ALL'
  actorRole: string | 'ALL'
  query: string
}

export const DEFAULT_ADMIN_AUDIT_LOG_FILTERS: AdminAuditLogFilters = {
  entity: 'ALL',
  action: 'ALL',
  actorRole: 'ALL',
  query: '',
}

export function searchAdminAuditLogs(filters: AdminAuditLogFilters): AuditLog[] {
  const normalizedQuery = normalizeSearchText(filters.query.trim())

  return mockAdminAuditLogs.filter((log) => {
    if (filters.entity !== 'ALL' && log.entity !== filters.entity) {
      return false
    }

    if (filters.action !== 'ALL' && log.action !== filters.action) {
      return false
    }

    if (filters.actorRole !== 'ALL' && log.actor_role !== filters.actorRole) {
      return false
    }

    if (normalizedQuery) {
      const id = normalizeSearchText(log.id)
      const entityId = normalizeSearchText(log.entity_id)
      const actorId = normalizeSearchText(log.actor_id)

      if (
        !id.includes(normalizedQuery) &&
        !entityId.includes(normalizedQuery) &&
        !actorId.includes(normalizedQuery)
      ) {
        return false
      }
    }

    return true
  })
}

export function hasActiveAdminAuditLogFilters(filters: AdminAuditLogFilters) {
  return (
    filters.entity !== 'ALL' ||
    filters.action !== 'ALL' ||
    filters.actorRole !== 'ALL' ||
    filters.query.trim() !== ''
  )
}

export function getAdminAuditLogById(logId: string) {
  return mockAdminAuditLogs.find((log) => log.id === logId)
}
