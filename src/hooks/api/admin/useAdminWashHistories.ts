import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  getWashHistoriesApi,
  type WashHistoryListParams,
} from '../../../api/washHistory.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapWashHistoriesWithBookingFallback } from '../../../utils/washHistoryEnrichment'
import { adminQueryKeys } from './queryKeys'

export interface AdminWashHistoryFilters {
  garageId?: string
}

export function useAdminWashHistories(filters: AdminWashHistoryFilters = {}) {
  const { isAuthenticated } = useAdminAuth()

  const apiParams = useMemo((): WashHistoryListParams => {
    const params: WashHistoryListParams = { limit: 100 }
    if (filters.garageId && filters.garageId !== 'ALL') {
      params.garage_id = filters.garageId
    }
    return params
  }, [filters.garageId])

  return useQuery({
    queryKey: adminQueryKeys.washHistories(apiParams),
    queryFn: async () => {
      const result = await getWashHistoriesApi(apiParams)
      const histories = await mapWashHistoriesWithBookingFallback(result.histories)
      return {
        histories,
        meta: result.meta,
      }
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}
