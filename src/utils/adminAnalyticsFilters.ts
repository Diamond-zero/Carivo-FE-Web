import type { ApiAnalyticsParams } from '../api/analytics.api'

export type AnalyticsGroupBy = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'

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
  { value: 'YEAR', label: 'Theo năm' },
]

export function analyticsFiltersToParams(
  filters: AnalyticsFilterValues,
): ApiAnalyticsParams | undefined {
  const params: ApiAnalyticsParams = {}

  let fromDate = filters.from
  let toDate = filters.to

  // Khi chọn "Theo năm" mà chưa chọn khoảng ngày, tự động lấy cả năm hiện tại để xem trọn vẹn 12 tháng
  if (filters.groupBy === 'YEAR' && !fromDate && !toDate) {
    const currentYear = new Date().getFullYear()
    fromDate = `${currentYear}-01-01`
    toDate = `${currentYear}-12-31`
  }

  if (fromDate) {
    const fromIso = new Date(fromDate)
    if (!Number.isNaN(fromIso.getTime())) {
      params.from = fromIso.toISOString()
    }
  }
  if (toDate) {
    const toIso = new Date(toDate)
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

  // Chuyển sang 'MONTH' để hiển thị biểu đồ 12 tháng của năm và tương thích 100% với server Render
  params.group_by = filters.groupBy === 'YEAR' ? 'MONTH' : filters.groupBy

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
