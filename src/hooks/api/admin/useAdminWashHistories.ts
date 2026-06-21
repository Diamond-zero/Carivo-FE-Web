import { useQuery } from '@tanstack/react-query'
import {
  getWashHistoriesApi,
  type WashHistoryListParams,
} from '../../../api/washHistory.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapApiWashHistory } from '../../../lib/mappers/staffMappers'
import { adminQueryKeys } from './queryKeys'

export function useAdminWashHistories(params?: WashHistoryListParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.washHistories(params),
    queryFn: async () => {
      const result = await getWashHistoriesApi({ limit: 100, ...params })
      return {
        histories: result.histories.map(mapApiWashHistory),
        meta: result.meta,
      }
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}
