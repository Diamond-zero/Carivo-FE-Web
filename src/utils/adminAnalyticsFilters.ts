import type { ApiAnalyticsParams } from '../api/analytics.api'

export type AnalyticsGroupBy = 'DAY' | 'WEEK' | 'MONTH'

export interface AnalyticsFilterValues {
  from: string
  to: string
  garageId: string
  servicePackageId: string
  vehicleType: 'MOTORBIKE' | 'CAR' | 'ALL'
  groupBy: AnalyticsGroupBy
}

export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFilterValues = {
  from: '',
  to: '',
  garageId: 'ALL',
  servicePackageId: 'ALL',
  vehicleType: 'ALL',
  groupBy: 'DAY',
}

export const ANALYTICS_GROUP_BY_OPTIONS: Array<{
  value: AnalyticsGroupBy
  label: string
}> = [
  { value: 'DAY', label: 'Theo ngày' },
  { value: 'WEEK', label: 'Theo tuần' },
  { value: 'MONTH', label: 'Theo tháng' },
]

export function analyticsFiltersToParams(
  filters: AnalyticsFilterValues,
): ApiAnalyticsParams | undefined {
  const params: ApiAnalyticsParams = {}

  if (filters.from) {
    const fromIso = new Date(filters.from)
    if (!Number.isNaN(fromIso.getTime())) {
      params.from = fromIso.toISOString()
    }
  }
  if (filters.to) {
    const toIso = new Date(filters.to)
    if (!Number.isNaN(toIso.getTime())) {
      // Move to end of day so the upper bound is inclusive
      toIso.setHours(23, 59, 59, 999)
      params.to = toIso.toISOString()
    }
  }
  if (filters.garageId && filters.garageId !== 'ALL') {
    params.garage_id = filters.garageId
  }
  if (filters.servicePackageId && filters.servicePackageId !== 'ALL') {
    params.service_package_id = filters.servicePackageId
  }
  if (filters.vehicleType !== 'ALL') {
    params.vehicle_type = filters.vehicleType
  }
  params.group_by = filters.groupBy

  return Object.keys(params).length > 0 ? params : undefined
}

export function hasActiveAnalyticsFilters(filters: AnalyticsFilterValues): boolean {
  return (
    Boolean(filters.from) ||
    Boolean(filters.to) ||
    filters.garageId !== DEFAULT_ANALYTICS_FILTERS.garageId ||
    filters.servicePackageId !== DEFAULT_ANALYTICS_FILTERS.servicePackageId ||
    filters.vehicleType !== DEFAULT_ANALYTICS_FILTERS.vehicleType ||
    filters.groupBy !== DEFAULT_ANALYTICS_FILTERS.groupBy
  )
}
