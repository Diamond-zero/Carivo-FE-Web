import { useQuery } from '@tanstack/react-query'
import {
  getAdminAuditLogsApi,
  type AuditLogListParams,
} from '../../../api/auditLog.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapApiAuditLog } from '../../../lib/mappers/adminMappers'
import { adminQueryKeys } from './queryKeys'

export function useAdminAuditLogs(params?: AuditLogListParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.auditLogs(params),
    queryFn: async () => {
      const result = await getAdminAuditLogsApi(params)
      return {
        logs: result.logs.map(mapApiAuditLog),
        meta: result.meta,
      }
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: (previous) => previous,
  })
}
