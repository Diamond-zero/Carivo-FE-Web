import type { AuditLog } from '../types/auditLog'

export interface AdminAuditLogFilters {
  action: string
  resourceType: string
  actorRole: string
  query: string
  dateFrom: string
  dateTo: string
  page: number
  limit: number
}

export const DEFAULT_ADMIN_AUDIT_LOG_FILTERS: AdminAuditLogFilters = {
  action: '',
  resourceType: '',
  actorRole: 'ALL',
  query: '',
  dateFrom: '',
  dateTo: '',
  page: 1,
  limit: 25,
}

/** Chuyển filter FE → params đúng spec Zod của BE */
export function adminAuditLogFiltersToParams(
  filters: AdminAuditLogFilters,
): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  if (filters.action.trim()) params.action = filters.action.trim().toUpperCase()
  if (filters.resourceType.trim())
    params.resource_type = filters.resourceType.trim().toUpperCase()
  if (filters.actorRole && filters.actorRole !== 'ALL')
    params.actor_role = filters.actorRole
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom)
    if (!Number.isNaN(fromDate.getTime())) params.from = fromDate.toISOString()
  }
  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo)
    if (!Number.isNaN(toDate.getTime())) {
      toDate.setHours(23, 59, 59, 999)
      params.to = toDate.toISOString()
    }
  }
  if (filters.query.trim()) params.q = filters.query.trim()
  if (filters.page > 1) params.page = filters.page
  if (filters.limit !== DEFAULT_ADMIN_AUDIT_LOG_FILTERS.limit)
    params.limit = filters.limit
  return params
}

export function hasActiveAdminAuditLogFilters(
  filters: AdminAuditLogFilters,
): boolean {
  return (
    filters.action.trim() !== '' ||
    filters.resourceType.trim() !== '' ||
    filters.actorRole !== 'ALL' ||
    filters.query.trim() !== '' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== ''
  )
}

export function getAdminAuditLogActorLabel(log: AuditLog): string {
  const actorName = log.actor?.full_name?.trim()
  if (actorName) return actorName
  if (log.actor_id) return log.actor_id
  return 'Hệ thống'
}

export function getAdminAuditLogActorRole(log: AuditLog): string {
  if (log.actor?.role) return log.actor.role
  if (log.actor_id) return 'SYSTEM'
  return 'SYSTEM'
}
