import type { ApiListResponse } from '../types/api/admin'
import type { ApiAuditLog, ApiPaginationMeta } from '../types/api/admin'
import { apiClient } from './client'

export interface AuditLogListParams {
  page?: number
  limit?: number
  actor_id?: string
  action?: string
  resource_type?: string
  resource_id?: string
  ip?: string
  from?: string
  to?: string
}

export interface AuditLogListResult {
  logs: ApiAuditLog[]
  meta: ApiPaginationMeta
}

export async function getAdminAuditLogsApi(
  params?: AuditLogListParams,
): Promise<AuditLogListResult> {
  const response = await apiClient.get<ApiListResponse<ApiAuditLog[]>>(
    '/admin/audit-logs',
    { params: { limit: 25, ...params } },
  )
  return {
    logs: response.data.data,
    meta: (response.data.meta ?? { page: 1, limit: 25, total: 0, total_pages: 1 }) as ApiPaginationMeta,
  }
}
