import { useQuery } from '@tanstack/react-query'
import { getStaffAnalyticsOverviewApi } from '../../../api/analytics.api'
import { useAuth } from '../../../contexts/AuthContext'
import { mapAnalyticsOverview } from '../../../lib/mappers/adminAnalyticsMappers'
import { getTodayDateString } from '../../../utils/format'
import { staffQueryKeys } from './queryKeys'

export function useStaffDashboardOverview() {
  const { isAuthenticated, session } = useAuth()
  const garageId = session?.staffProfile.garage_id ?? undefined
  const date = getTodayDateString()

  return useQuery({
    queryKey: staffQueryKeys.dashboardOverview(garageId, date),
    queryFn: async () => {
      const data = await getStaffAnalyticsOverviewApi({
        from: `${date}T00:00:00.000+07:00`,
        to: `${date}T23:59:59.999+07:00`,
        group_by: 'DAY',
      })
      return mapAnalyticsOverview(data)
    },
    enabled: isAuthenticated && Boolean(garageId),
    staleTime: 30_000,
  })
}
