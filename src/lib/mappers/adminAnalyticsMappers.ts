import { BOOKING_STATUS_LABELS } from '../../constants/bookingStatus'
import { VEHICLE_TYPE_LABELS } from '../../constants/washBayStatus'
import type {
  AnalyticsDayPoint,
  AnalyticsGaragePerformanceRow,
  AnalyticsPromotionsPerformanceRow,
  AnalyticsRevenueDistributionRow,
  AnalyticsServicePerformanceRow,
  AnalyticsStatusDistributionRow,
  AnalyticsVehicleTypeDistributionRow,
  AnalyticsWashBayPerformanceRow,
  AnalyticsRevenueOverview,
  AnalyticsBookingOverview,
  AnalyticsCustomerActivityRow,
  AnalyticsCustomerData,
  AnalyticsCustomerRankingRow,
  AnalyticsRevenueMetrics,
  AnalyticsWashBayMetrics,
  AnalyticsPromotionOverview,
  AnalyticsTrendPoint,
} from '../../types/adminAnalytics'
import type { VehicleType } from '../../types/washBay'

/* ---------- Helpers ---------- */
function readNumber(data: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
      return Number(value)
    }
  }
  return 0
}

function readString(data: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'string' && value.trim() !== '') {
      return value
    }
  }
  return ''
}

function readBoolean(data: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'boolean') {
      return value
    }
  }
  return false
}

function readArray(data: Record<string, unknown>, ...keys: string[]): unknown[] {
  for (const key of keys) {
    const value = data[key]
    if (Array.isArray(value)) {
      return value
    }
  }
  return []
}

function readRecord(
  data: Record<string, unknown>,
  ...keys: string[]
): Record<string, unknown> {
  for (const key of keys) {
    const value = data[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }
  }
  return {}
}

function readObjectId(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null) {
    const maybe = value as { toString?: () => string }
    if (typeof maybe.toString === 'function') {
      const str = maybe.toString()
      if (str && str !== '[object Object]') return str
    }
  }
  return ''
}

function periodLabel(period: string, groupBy: string): string {
  if (!period) return ''
  // Backend returns DAY: 'YYYY-MM-DD'; WEEK: 'YYYY-Www'; MONTH: 'YYYY-MM'
  if (groupBy === 'MONTH') {
    const [year, month] = period.split('-')
    if (year && month) return `T${month}/${year.slice(2)}`
    return period
  }
  if (groupBy === 'WEEK') {
    return period.replace('-', ' / ')
  }
  // DAY
  const parts = period.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`
  }
  return period
}

function mapTrend(raw: unknown[]): AnalyticsTrendPoint[] {
  return raw.map((entry) => {
    const row = (entry ?? {}) as Record<string, unknown>
    const period = readString(row, 'period')
    const groupBy = readString(row, 'group_by', 'groupBy') || 'DAY'
    const count = readNumber(row, 'count')
    const revenue = readNumber(row, 'revenue')

    return {
      period,
      label: periodLabel(period, groupBy),
      count,
      revenue,
    }
  })
}

/* ---------- Overview mapper ---------- */
export function mapAnalyticsOverview(
  data: Record<string, unknown>,
): AnalyticsRevenueOverview {
  const metrics = readRecord(data, 'metrics')
  const period = readRecord(data, 'period')
  const tierDistribution = readRecord(data, 'tier_distribution')

  const totalBookings = readNumber(metrics, 'total_bookings')
  const completedBookings = readNumber(metrics, 'completed_bookings')
  const canceledBookings = readNumber(metrics, 'canceled_bookings')
  const noShowBookings = readNumber(metrics, 'no_show_bookings')
  const registeredCustomerBookings = readNumber(
    metrics,
    'registered_customer_bookings',
  )
  const walkInBookings = readNumber(metrics, 'walk_in_bookings')
  const uniqueCustomers = readNumber(metrics, 'unique_registered_customers')

  return {
    total_bookings: totalBookings,
    completed_bookings: completedBookings,
    canceled_bookings: canceledBookings,
    no_show_bookings: noShowBookings,
    completion_rate: readNumber(metrics, 'completion_rate'),
    cancellation_rate: readNumber(metrics, 'cancellation_rate'),
    no_show_rate: readNumber(metrics, 'no_show_rate'),
    registered_customer_bookings: registeredCustomerBookings,
    walk_in_bookings: walkInBookings,
    unique_registered_customers: uniqueCustomers,
    total_revenue: readNumber(metrics, 'total_revenue'),
    original_revenue: readNumber(metrics, 'original_revenue'),
    total_discount: readNumber(metrics, 'total_discount'),
    average_order_value: readNumber(metrics, 'average_order_value'),
    active_customers: uniqueCustomers,
    average_booking_value: readNumber(metrics, 'average_order_value'),
    period_from: readString(period, 'from'),
    period_to: readString(period, 'to'),
    group_by: (readString(period, 'group_by') as 'DAY' | 'WEEK' | 'MONTH') || 'DAY',
    tier_distribution: {
      BRONZE: readNumber(tierDistribution, 'BRONZE'),
      SILVER: readNumber(tierDistribution, 'SILVER'),
      GOLD: readNumber(tierDistribution, 'GOLD'),
      PLATINUM: readNumber(tierDistribution, 'PLATINUM'),
    },
  }
}

export function mapBookingAnalyticsOverview(
  data: Record<string, unknown>,
): AnalyticsBookingOverview {
  const metrics = readRecord(data, 'metrics')
  const totalBookings = readNumber(metrics, 'total_bookings')

  return {
    total_bookings: totalBookings,
    completed_bookings: readNumber(metrics, 'completed_bookings'),
    canceled_bookings: readNumber(metrics, 'canceled_bookings'),
    no_show_bookings: readNumber(metrics, 'no_show_bookings'),
    completion_rate: readNumber(metrics, 'completion_rate'),
    cancellation_rate: readNumber(metrics, 'cancellation_rate'),
    no_show_rate: readNumber(metrics, 'no_show_rate'),
    scheduled_duration_average_minutes: readNumber(
      metrics,
      'scheduled_duration_average_minutes',
    ),
    actual_duration_average_minutes: readNumber(
      metrics,
      'actual_duration_average_minutes',
    ),
    late_booking_count: readNumber(metrics, 'late_booking_count'),
    reschedule_count: readNumber(metrics, 'reschedule_count'),
    walk_in_bookings: readNumber(metrics, 'walk_in_bookings'),
    registered_customer_bookings: readNumber(
      metrics,
      'registered_customer_bookings',
    ),
  }
}

function mapCustomerRankingRows(raw: unknown[]): AnalyticsCustomerRankingRow[] {
  return raw.map((entry) => {
    const row = (entry ?? {}) as Record<string, unknown>
    const favoriteService = readRecord(row, 'favorite_service')
    const lastVisitAt = readString(row, 'last_visit_at')

    return {
      customer_id: readString(row, 'customer_id'),
      full_name: readString(row, 'full_name') || 'Khách hàng',
      is_active: readBoolean(row, 'is_active'),
      total_visits: readNumber(row, 'total_visits'),
      total_spent: readNumber(row, 'total_spent'),
      average_order_value: readNumber(row, 'average_order_value'),
      distinct_service_count: readNumber(row, 'distinct_service_count'),
      favorite_service: {
        id: readString(favoriteService, 'id'),
        name: readString(favoriteService, 'name') || 'Chưa xác định',
        usage_count: readNumber(favoriteService, 'usage_count'),
      },
      last_visit_at: lastVisitAt || null,
    }
  })
}

export function mapCustomerAnalytics(data: Record<string, unknown>): AnalyticsCustomerData {
  const account = readRecord(data, 'account_metrics')
  const funnel = readRecord(data, 'funnel')
  const bookingMix = readRecord(data, 'booking_mix')
  const walkIn = readRecord(bookingMix, 'walk_in')
  const registered = readRecord(bookingMix, 'registered_customer')
  const value = readRecord(data, 'customer_value_metrics')
  const topCustomers = readRecord(data, 'top_customers')
  const activityLabels: Record<string, string> = {
    ONE_TIME: 'Dùng một lần',
    REPEAT: 'Quay lại',
    LOYAL: 'Trung thành',
  }
  const activityDistribution: AnalyticsCustomerActivityRow[] = readArray(
    data,
    'activity_distribution',
  ).map((entry) => {
    const row = (entry ?? {}) as Record<string, unknown>
    const key = readString(row, 'key')
    return {
      key,
      label: activityLabels[key] ?? key,
      count: readNumber(row, 'count'),
    }
  })

  return {
    accountMetrics: {
      total_customers: readNumber(account, 'total_customers'),
      new_customers: readNumber(account, 'new_customers'),
      active_accounts: readNumber(account, 'active_accounts'),
      locked_accounts: readNumber(account, 'locked_accounts'),
      verified_accounts: readNumber(account, 'verified_accounts'),
      verification_rate: readNumber(account, 'verification_rate'),
    },
    funnel: {
      registered_customers: readNumber(funnel, 'registered_customers'),
      activated_customers: readNumber(funnel, 'activated_customers'),
      registered_without_paid_visit: readNumber(
        funnel,
        'registered_without_paid_visit',
      ),
      repeat_customers: readNumber(funnel, 'repeat_customers'),
      activation_rate: readNumber(funnel, 'activation_rate'),
      repeat_rate: readNumber(funnel, 'repeat_rate'),
      average_days_to_first_paid_visit: readNumber(
        funnel,
        'average_days_to_first_paid_visit',
      ),
    },
    registrationTrend: mapTrend(readArray(data, 'registration_trend')),
    bookingMix: {
      total_bookings: readNumber(bookingMix, 'total_bookings'),
      walk_in: {
        bookings: readNumber(walkIn, 'bookings'),
        share: readNumber(walkIn, 'share'),
        completed_bookings: readNumber(walkIn, 'completed_bookings'),
        completion_rate: readNumber(walkIn, 'completion_rate'),
      },
      registered_customer: {
        bookings: readNumber(registered, 'bookings'),
        share: readNumber(registered, 'share'),
        completed_bookings: readNumber(registered, 'completed_bookings'),
        completion_rate: readNumber(registered, 'completion_rate'),
      },
    },
    valueMetrics: {
      unique_paying_customers: readNumber(value, 'unique_paying_customers'),
      total_paid_visits: readNumber(value, 'total_paid_visits'),
      total_revenue: readNumber(value, 'total_revenue'),
      average_order_value: readNumber(value, 'average_order_value'),
      average_paid_visits_per_customer: readNumber(
        value,
        'average_paid_visits_per_customer',
      ),
      registered_paid_visits: readNumber(value, 'registered_paid_visits'),
      walk_in_paid_visits: readNumber(value, 'walk_in_paid_visits'),
      registered_revenue: readNumber(value, 'registered_revenue'),
      walk_in_revenue: readNumber(value, 'walk_in_revenue'),
    },
    activityDistribution,
    topCustomers: {
      by_visits: mapCustomerRankingRows(readArray(topCustomers, 'by_visits')),
      by_spending: mapCustomerRankingRows(readArray(topCustomers, 'by_spending')),
      by_service_variety: mapCustomerRankingRows(
        readArray(topCustomers, 'by_service_variety'),
      ),
      single_service_repeat: mapCustomerRankingRows(
        readArray(topCustomers, 'single_service_repeat'),
      ),
    },
    generatedAt: readString(data, 'generated_at'),
  }
}

export function mapRevenueMetrics(
  data: Record<string, unknown>,
): AnalyticsRevenueMetrics {
  const metrics = readRecord(data, 'metrics')
  return {
    paid_booking_count: readNumber(metrics, 'paid_booking_count'),
    net_revenue: readNumber(metrics, 'net_revenue'),
    total_revenue: readNumber(metrics, 'net_revenue'),
    original_revenue: readNumber(metrics, 'original_revenue'),
    total_discount: readNumber(metrics, 'total_discount'),
    average_order_value: readNumber(metrics, 'average_order_value'),
  }
}

export function mapWashBayMetrics(
  data: Record<string, unknown>,
): AnalyticsWashBayMetrics {
  const metrics = readRecord(data, 'metrics')
  return {
    assigned_booking_count: readNumber(metrics, 'assigned_booking_count'),
    occupied_minutes: readNumber(metrics, 'occupied_minutes'),
    estimated_utilization: readNumber(metrics, 'estimated_utilization'),
  }
}

export function mapPromotionOverview(
  data: Record<string, unknown>,
): AnalyticsPromotionOverview {
  const metrics = readRecord(data, 'metrics')
  return {
    consumed_usage_count: readNumber(metrics, 'consumed_usage_count'),
    unique_customer_count: readNumber(metrics, 'unique_customer_count'),
    walk_in_usage_count: readNumber(metrics, 'walk_in_usage_count'),
    total_discount: readNumber(metrics, 'total_discount'),
    promoted_booking_revenue: readNumber(metrics, 'promoted_booking_revenue'),
    average_discount: readNumber(metrics, 'average_discount'),
  }
}

/* ---------- Distribution mappers ---------- */
export function mapStatusDistribution(
  data: Record<string, unknown>,
): AnalyticsStatusDistributionRow[] {
  const items = readArray(data, 'status_distribution')
  return items.map((entry, index) => {
    const row = (entry ?? {}) as Record<string, unknown>
    const status = readString(row, 'key', 'status')
    const label =
      BOOKING_STATUS_LABELS[status as keyof typeof BOOKING_STATUS_LABELS] ||
      status ||
      'Khác'

    return {
      status: status || label,
      label,
      count: readNumber(row, 'count'),
      // Stable index for color selection
      sort_index: index,
    }
  })
}

export function mapVehicleTypeDistribution(
  data: Record<string, unknown>,
): AnalyticsVehicleTypeDistributionRow[] {
  const items = readArray(data, 'vehicle_type_distribution')
  return items.map((entry) => {
    const row = (entry ?? {}) as Record<string, unknown>
    const vehicleType = readString(row, 'key', 'vehicle_type') as VehicleType
    return {
      vehicle_type: (vehicleType || 'CAR') as VehicleType,
      label:
        VEHICLE_TYPE_LABELS[vehicleType as VehicleType] || vehicleType || 'Khác',
      count: readNumber(row, 'count'),
    }
  })
}

export function mapTimeOfDayDistribution(
  data: Record<string, unknown>,
): AnalyticsVehicleTypeDistributionRow[] {
  const items = readArray(data, 'time_of_day_distribution')
  const labels: Record<string, string> = {
    MORNING: 'Buổi sáng',
    AFTERNOON: 'Buổi chiều',
    EVENING: 'Buổi tối',
  }
  return items.map((entry) => {
    const row = (entry ?? {}) as Record<string, unknown>
    const bucket = readString(row, 'key')
    return {
      vehicle_type: bucket, // reuse shape but treat as bucket id
      label: labels[bucket] || bucket || 'Khác',
      count: readNumber(row, 'count'),
    }
  })
}

export function mapGarageDistributionFromBookings(
  data: Record<string, unknown>,
): AnalyticsRevenueDistributionRow[] {
  const items = readArray(data, 'garage_distribution')
  return items.map((entry, index) => {
    const row = (entry ?? {}) as Record<string, unknown>
    return {
      id: readObjectId(row.key) || `garage-${index}`,
      label: readString(row, 'key') || `Garage #${index + 1}`,
      count: readNumber(row, 'count'),
      revenue: 0,
    }
  })
}

export function mapRevenueByGarage(
  data: Record<string, unknown>,
): AnalyticsRevenueDistributionRow[] {
  const items = readArray(data, 'by_garage')
  return items.map((entry, index) => {
    const row = (entry ?? {}) as Record<string, unknown>
    const nested = readRecord(row, 'key')
    const id = readObjectId(nested.id) || readObjectId(row.key) || `garage-${index}`
    return {
      id,
      label: readString(nested, 'name') || readString(row, 'name') || `Garage #${index + 1}`,
      count: readNumber(row, 'count'),
      revenue: readNumber(row, 'revenue'),
    }
  })
}

export function mapRevenueByServicePackage(
  data: Record<string, unknown>,
): AnalyticsRevenueDistributionRow[] {
  const items = readArray(data, 'by_primary_service_package')
  return items.map((entry, index) => {
    const row = (entry ?? {}) as Record<string, unknown>
    const nested = readRecord(row, 'key')
    const id = readObjectId(nested.id) || `pkg-${index}`
    return {
      id,
      label:
        readString(nested, 'name') ||
        readString(row, 'name') ||
        `Gói #${index + 1}`,
      count: readNumber(row, 'count'),
      revenue: readNumber(row, 'revenue'),
    }
  })
}

export function mapRevenueByVehicleType(
  data: Record<string, unknown>,
): AnalyticsRevenueDistributionRow[] {
  const items = readArray(data, 'by_vehicle_type')
  return items.map((entry, index) => {
    const row = (entry ?? {}) as Record<string, unknown>
    const vehicleType = readString(row, 'key') as VehicleType
    return {
      id: vehicleType || `vehicle-${index}`,
      label: VEHICLE_TYPE_LABELS[vehicleType as VehicleType] || vehicleType || 'Khác',
      count: readNumber(row, 'count'),
      revenue: readNumber(row, 'revenue'),
    }
  })
}

export function mapRevenueByPaymentMethod(
  data: Record<string, unknown>,
): AnalyticsRevenueDistributionRow[] {
  const items = readArray(data, 'by_payment_method')
  const labels: Record<string, string> = {
    CASH: 'Tiền mặt',
    BANK_TRANSFER: 'Chuyển khoản',
    CARD: 'Thẻ',
    WALLET: 'Ví điện tử',
    MOMO: 'MoMo',
    VNPAY: 'VNPay',
    ZALOPAY: 'ZaloPay',
    OTHER: 'Khác',
  }
  return items.map((entry, index) => {
    const row = (entry ?? {}) as Record<string, unknown>
    const method = readString(row, 'key')
    return {
      id: method || `method-${index}`,
      label: labels[method] || method || 'Khác',
      count: readNumber(row, 'count'),
      revenue: readNumber(row, 'revenue'),
    }
  })
}

/* ---------- Service / garage / wash bay / promotion row mappers ---------- */
export function mapWashBayPerformanceRows(
  data: Record<string, unknown>,
): AnalyticsWashBayPerformanceRow[] {
  const items = readArray(data, 'by_wash_bay')
  return items.map((entry, index) => {
    const row = (entry ?? {}) as Record<string, unknown>
    const bay = readRecord(row, 'wash_bay')
    return {
      bay_id: readString(bay, 'id') || `bay-${index}`,
      bay_code: readString(bay, 'bay_code') || '—',
      bay_name: readString(bay, 'name') || '—',
      garage_id: readString(bay, 'garage_id'),
      garage_name: readString(bay, 'garage_name') || '—',
      booking_count: readNumber(row, 'booking_count'),
      occupied_minutes: readNumber(row, 'occupied_minutes'),
      estimated_utilization: readNumber(row, 'estimated_utilization'),
      revenue: readNumber(row, 'revenue'),
      average_service_duration_minutes: readNumber(
        row,
        'average_service_duration_minutes',
      ),
    }
  })
}

export function mapWashBayVehicleTypeSplit(
  data: Record<string, unknown>,
): AnalyticsVehicleTypeDistributionRow[] {
  const items = readArray(data, 'vehicle_type_split')
  return items.map((entry) => {
    const row = (entry ?? {}) as Record<string, unknown>
    const vehicleType = readString(row, 'key') as VehicleType
    return {
      vehicle_type: (vehicleType || 'CAR') as VehicleType,
      label:
        VEHICLE_TYPE_LABELS[vehicleType as VehicleType] || vehicleType || 'Khác',
      count: readNumber(row, 'count'),
    }
  })
}

export function mapGaragePerformanceRows(
  data: Record<string, unknown>,
): AnalyticsGaragePerformanceRow[] {
  const items = readArray(data, 'data')
  return items.map((entry, index) => {
    const row = (entry ?? {}) as Record<string, unknown>
    return {
      garage_id: readString(row, 'id') || `garage-${index}`,
      garage_name: readString(row, 'name') || `Garage #${index + 1}`,
      garage_code: readString(row, 'code') || '—',
      total_bookings: readNumber(row, 'total_bookings'),
      completed_bookings: readNumber(row, 'completed_bookings'),
      canceled_bookings: readNumber(row, 'canceled_bookings'),
      no_show_bookings: readNumber(row, 'no_show_bookings'),
      completion_rate: readNumber(row, 'completion_rate'),
      cancellation_rate: readNumber(row, 'cancellation_rate'),
      no_show_rate: readNumber(row, 'no_show_rate'),
      scheduled_duration_average_minutes: readNumber(
        row,
        'scheduled_duration_average_minutes',
      ),
      actual_duration_average_minutes: readNumber(
        row,
        'actual_duration_average_minutes',
      ),
      total_revenue: readNumber(row, 'revenue'),
      average_order_value: readNumber(row, 'average_order_value'),
    }
  })
}

export function mapServicePerformanceRows(
  data: Record<string, unknown>,
): AnalyticsServicePerformanceRow[] {
  const items = readArray(data, 'data')
  return items.map((entry, index) => {
    const row = (entry ?? {}) as Record<string, unknown>
    return {
      service_package_id: readString(row, 'id') || `pkg-${index}`,
      service_name: readString(row, 'name') || `Gói #${index + 1}`,
      service_code: readString(row, 'code') || '—',
      total_bookings: readNumber(row, 'total_bookings'),
      completed_bookings: readNumber(row, 'completed_bookings'),
      canceled_bookings: readNumber(row, 'canceled_bookings'),
      no_show_bookings: readNumber(row, 'no_show_bookings'),
      completion_rate: readNumber(row, 'completion_rate'),
      total_revenue: readNumber(row, 'revenue'),
      average_order_value: readNumber(row, 'average_order_value'),
      scheduled_duration_average_minutes: readNumber(
        row,
        'scheduled_duration_average_minutes',
      ),
      actual_duration_average_minutes: readNumber(
        row,
        'actual_duration_average_minutes',
      ),
    }
  })
}

export function mapPromotionPerformanceRows(
  data: Record<string, unknown>,
): AnalyticsPromotionsPerformanceRow[] {
  const items = readArray(data, 'top_promotions')
  return items.map((entry, index) => {
    const row = (entry ?? {}) as Record<string, unknown>
    const promo = readRecord(row, 'promotion')
    const usageCount = readNumber(row, 'usage_count')
    const totalDiscount = readNumber(row, 'total_discount')
    const revenue = readNumber(row, 'revenue')
    const avgDiscount = usageCount > 0 ? totalDiscount / usageCount : 0

    return {
      promotion_id: readObjectId(promo.id) || `promo-${index}`,
      promotion_name: readString(promo, 'name') || `Khuyến mãi #${index + 1}`,
      code: readString(promo, 'code') || '—',
      total_uses: usageCount,
      total_discount: totalDiscount,
      total_revenue: revenue,
      average_discount: avgDiscount,
    }
  })
}

export function mapPromotionUsageByGarage(
  data: Record<string, unknown>,
): AnalyticsRevenueDistributionRow[] {
  const items = readArray(data, 'usage_by_garage')
  return items.map((entry, index) => {
    const row = (entry ?? {}) as Record<string, unknown>
    const id = readObjectId(row.key) || `garage-${index}`
    return {
      id,
      label: readString(row, 'key') || `Garage #${index + 1}`,
      count: readNumber(row, 'count'),
      revenue: 0,
    }
  })
}

/* ---------- Booking-only trend helpers (for daily charts) ---------- */
export function mapBookingTrend(
  data: Record<string, unknown>,
): AnalyticsTrendPoint[] {
  return mapTrend(readArray(data, 'trend'))
}

export function mapRevenueTrend(
  data: Record<string, unknown>,
): AnalyticsTrendPoint[] {
  return mapTrend(readArray(data, 'trend'))
}

/* ---------- Legacy mappers (kept for dashboard/older callers) ---------- */
export function mapDailyBookingStats(data: Record<string, unknown>): AnalyticsDayPoint[] {
  return mapTrend(readArray(data, 'trend')).map((row) => ({
    date: row.period,
    label: row.label,
    bookings: row.count,
    revenue: row.revenue,
  }))
}

export function mapMonthlyRevenueStats(data: Record<string, unknown>): AnalyticsDayPoint[] {
  return mapTrend(readArray(data, 'trend')).map((row) => ({
    date: row.period,
    label: row.label,
    bookings: row.count,
    revenue: row.revenue,
  }))
}

export function mapGarageRevenueStats(data: Record<string, unknown>): AnalyticsRevenueDistributionRow[] {
  return mapRevenueByGarage(data)
}

export function mapBookingStatusStats(data: Record<string, unknown>): AnalyticsStatusDistributionRow[] {
  return mapStatusDistribution(data)
}

export function mapVehicleTypeBookingStats(
  data: Record<string, unknown>,
): AnalyticsVehicleTypeDistributionRow[] {
  // Prefer revenue vector if present, else fall back to booking distribution
  if (readArray(data, 'by_vehicle_type').length > 0) {
    return mapRevenueByVehicleType(data).map((row) => ({
      vehicle_type: row.id as VehicleType,
      label: row.label,
      count: row.count,
    }))
  }
  return mapVehicleTypeDistribution(data)
}
