import { useQuery } from '@tanstack/react-query'
import {
  getAnalyticsBookingsApi,
  getAnalyticsOverviewApi,
  getAnalyticsRevenueApi,
  getAnalyticsWashBaysApi,
} from '../../../api/analytics.api'
import type { ApiAnalyticsParams } from '../../../types/api/admin'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import {
  mapAnalyticsOverview,
  mapBookingStatusStats,
  mapDailyBookingStats,
  mapGarageRevenueStats,
  mapMonthlyRevenueStats,
  mapVehicleTypeBookingStats,
  mapWashBayPerformanceRows,
} from '../../../lib/mappers/adminAnalyticsMappers'
import { adminQueryKeys } from './queryKeys'

export function useAdminAnalyticsOverview(params?: ApiAnalyticsParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.analyticsOverview(params),
    queryFn: async () => {
      const data = await getAnalyticsOverviewApi(params)
      return {
        overview: mapAnalyticsOverview(data),
        dailyStats: mapDailyBookingStats(data),
        raw: data,
      }
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}

export function useAdminAnalyticsBookings(params?: ApiAnalyticsParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.analyticsBookings(params),
    queryFn: async () => {
      const data = await getAnalyticsBookingsApi(params)
      return {
        overview: mapAnalyticsOverview(data),
        dailyStats: mapDailyBookingStats(data),
        statusStats: mapBookingStatusStats(data),
        vehicleTypeStats: mapVehicleTypeBookingStats(data),
        raw: data,
      }
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}

export function useAdminAnalyticsRevenue(params?: ApiAnalyticsParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.analyticsRevenue(params),
    queryFn: async () => {
      const data = await getAnalyticsRevenueApi(params)
      return {
        overview: mapAnalyticsOverview(data),
        monthlyStats: mapMonthlyRevenueStats(data),
        garageStats: mapGarageRevenueStats(data),
        raw: data,
      }
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}

export function useAdminAnalyticsWashBays(params?: ApiAnalyticsParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.analyticsWashBays(params),
    queryFn: async () => {
      const data = await getAnalyticsWashBaysApi(params)
      return {
        rows: mapWashBayPerformanceRows(data),
        raw: data,
      }
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}
