import { useQuery } from '@tanstack/react-query'
import {
  getAnalyticsBookingsApi,
  getAnalyticsCustomersApi,
  getAnalyticsGaragesApi,
  getAnalyticsOverviewApi,
  getAnalyticsPaymentsApi,
  getAnalyticsPromotionsApi,
  getAnalyticsRevenueApi,
  getAnalyticsServicesApi,
  getAnalyticsWashBaysApi,
  type ApiAnalyticsParams,
} from '../../../api/analytics.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import {
  mapAnalyticsOverview,
  mapBookingAnalyticsOverview,
  mapCustomerAnalytics,
  mapBookingStatusStats,
  mapBookingTrend,
  mapGarageDistributionFromBookings,
  mapGaragePerformanceRows,
  mapPromotionOverview,
  mapPromotionPerformanceRows,
  mapPromotionUsageByGarage,
  mapRevenueByGarage,
  mapRevenueByPaymentMethod,
  mapRevenueByServicePackage,
  mapRevenueByVehicleType,
  mapRevenueMetrics,
  mapRevenueTrend,
  mapServicePerformanceRows,
  mapTimeOfDayDistribution,
  mapVehicleTypeDistribution,
  mapWashBayMetrics,
  mapWashBayPerformanceRows,
  mapWashBayVehicleTypeSplit,
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
        overview: mapBookingAnalyticsOverview(data),
        trend: mapBookingTrend(data),
        statusStats: mapBookingStatusStats(data),
        vehicleTypeStats: mapVehicleTypeDistribution(data),
        timeOfDayStats: mapTimeOfDayDistribution(data),
        garageStats: mapGarageDistributionFromBookings(data),
        raw: data,
      }
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}

export function useAdminAnalyticsCustomers(params?: ApiAnalyticsParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.analyticsCustomers(params),
    queryFn: async () => mapCustomerAnalytics(await getAnalyticsCustomersApi(params)),
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
        metrics: mapRevenueMetrics(data),
        trend: mapRevenueTrend(data),
        byGarage: mapRevenueByGarage(data),
        byServicePackage: mapRevenueByServicePackage(data),
        byVehicleType: mapRevenueByVehicleType(data),
        byPaymentMethod: mapRevenueByPaymentMethod(data),
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
        metrics: mapWashBayMetrics(data),
        rows: mapWashBayPerformanceRows(data),
        vehicleTypeSplit: mapWashBayVehicleTypeSplit(data),
        raw: data,
      }
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}

export function useAdminAnalyticsGarages(params?: ApiAnalyticsParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.analyticsGarages(params),
    queryFn: async () => {
      const data = await getAnalyticsGaragesApi(params)
      return {
        rows: mapGaragePerformanceRows(data),
        raw: data,
      }
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}

export function useAdminAnalyticsServices(params?: ApiAnalyticsParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.analyticsServices(params),
    queryFn: async () => {
      const data = await getAnalyticsServicesApi(params)
      return {
        rows: mapServicePerformanceRows(data),
        raw: data,
      }
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}

export function useAdminAnalyticsPromotions(params?: ApiAnalyticsParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.analyticsPromotions(params),
    queryFn: async () => {
      const data = await getAnalyticsPromotionsApi(params)
      return {
        overview: mapPromotionOverview(data),
        rows: mapPromotionPerformanceRows(data),
        usageByGarage: mapPromotionUsageByGarage(data),
        raw: data,
      }
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}

export function useAdminAnalyticsPayments(params?: ApiAnalyticsParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: [...adminQueryKeys.analyticsPromotions(params), 'payments'] as const,
    queryFn: async () => {
      const data = await getAnalyticsPaymentsApi(params)
      return data
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}
