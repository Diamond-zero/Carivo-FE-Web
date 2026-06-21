import { BOOKING_STATUS_LABELS } from '../../constants/bookingStatus'
import { VEHICLE_TYPE_LABELS } from '../../constants/washBayStatus'
import type {
  AnalyticsOverview,
  BookingStatusStat,
  DailyBookingStat,
  GarageRevenueStat,
  MonthlyRevenueStat,
  VehicleTypeBookingStat,
  WashBayPerformanceRow,
} from '../../types/adminAnalytics'
import type { LoyaltyTier } from '../../types/loyalty'
import type { VehicleType } from '../../types/washBay'

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

function readArray(data: Record<string, unknown>, ...keys: string[]): unknown[] {
  for (const key of keys) {
    const value = data[key]
    if (Array.isArray(value)) {
      return value
    }
  }
  return []
}

function readRecord(data: Record<string, unknown>, ...keys: string[]): Record<string, unknown> {
  for (const key of keys) {
    const value = data[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }
  }
  return {}
}

function readString(item: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = item[key]
    if (typeof value === 'string' && value.trim() !== '') {
      return value
    }
  }
  return ''
}

const DEFAULT_TIER_DISTRIBUTION: Record<LoyaltyTier, number> = {
  BRONZE: 0,
  SILVER: 0,
  GOLD: 0,
  PLATINUM: 0,
}

export function mapAnalyticsOverview(data: Record<string, unknown>): AnalyticsOverview {
  const tierRaw = readRecord(data, 'tier_distribution', 'tierDistribution')
  const tier_distribution = { ...DEFAULT_TIER_DISTRIBUTION }

  for (const tier of Object.keys(DEFAULT_TIER_DISTRIBUTION) as LoyaltyTier[]) {
    tier_distribution[tier] = readNumber(tierRaw, tier, tier.toLowerCase())
  }

  const totalBookings = readNumber(data, 'total_bookings', 'totalBookings')
  const completedBookings = readNumber(
    data,
    'completed_bookings',
    'completedBookings',
  )

  return {
    total_bookings: totalBookings,
    completed_bookings: completedBookings || totalBookings,
    total_revenue: readNumber(data, 'total_revenue', 'totalRevenue'),
    active_customers: readNumber(data, 'active_customers', 'activeCustomers'),
    average_booking_value: readNumber(
      data,
      'average_booking_value',
      'averageBookingValue',
      'avg_booking_value',
    ),
    tier_distribution,
  }
}

export function mapDailyBookingStats(data: Record<string, unknown>): DailyBookingStat[] {
  const items = readArray(
    data,
    'daily_stats',
    'dailyStats',
    'daily_booking_stats',
    'bookings_by_day',
    'series',
  )

  return items.map((item, index) => {
    const row = (item ?? {}) as Record<string, unknown>
    const date = readString(row, 'date', 'day', 'label')
    return {
      date: date || `day-${index + 1}`,
      label: readString(row, 'label', 'day_label', 'dayLabel') || date || `D${index + 1}`,
      bookings: readNumber(row, 'bookings', 'count', 'total_bookings', 'totalBookings'),
      revenue: readNumber(row, 'revenue', 'total_revenue', 'totalRevenue'),
    }
  })
}

export function mapMonthlyRevenueStats(data: Record<string, unknown>): MonthlyRevenueStat[] {
  const items = readArray(
    data,
    'monthly_stats',
    'monthlyStats',
    'monthly_revenue',
    'revenue_by_month',
    'series',
  )

  return items.map((item, index) => {
    const row = (item ?? {}) as Record<string, unknown>
    const month = readString(row, 'month', 'period', 'label')
    return {
      month: month || `month-${index + 1}`,
      label: readString(row, 'label', 'month_label', 'monthLabel') || month || `T${index + 1}`,
      revenue: readNumber(row, 'revenue', 'total_revenue', 'totalRevenue'),
    }
  })
}

export function mapGarageRevenueStats(data: Record<string, unknown>): GarageRevenueStat[] {
  const items = readArray(
    data,
    'garage_stats',
    'garageStats',
    'garage_revenue',
    'revenue_by_garage',
    'garages',
  )

  return items.map((item, index) => {
    const row = (item ?? {}) as Record<string, unknown>
    const garage = readRecord(row, 'garage')
    return {
      garage_id: readString(row, 'garage_id', 'garageId') || readString(garage, 'id') || `garage-${index}`,
      garage_name:
        readString(row, 'garage_name', 'garageName') ||
        readString(garage, 'name') ||
        'Garage',
      revenue: readNumber(row, 'revenue', 'total_revenue', 'totalRevenue'),
      bookings: readNumber(row, 'bookings', 'booking_count', 'bookingCount', 'count'),
    }
  })
}

export function mapBookingStatusStats(data: Record<string, unknown>): BookingStatusStat[] {
  const items = readArray(
    data,
    'status_stats',
    'statusStats',
    'booking_status_stats',
    'by_status',
  )

  return items.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>
    const status = readString(row, 'status', 'key')
    const label =
      readString(row, 'label') ||
      BOOKING_STATUS_LABELS[status as keyof typeof BOOKING_STATUS_LABELS] ||
      status ||
      'Khác'

    return {
      status: status || label,
      label,
      count: readNumber(row, 'count', 'bookings', 'total'),
    }
  })
}

export function mapVehicleTypeBookingStats(
  data: Record<string, unknown>,
): VehicleTypeBookingStat[] {
  const items = readArray(
    data,
    'vehicle_type_stats',
    'vehicleTypeStats',
    'by_vehicle_type',
    'vehicle_types',
  )

  return items.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>
    const vehicleType = readString(row, 'vehicle_type', 'vehicleType', 'type') as VehicleType
    return {
      vehicle_type: vehicleType || 'CAR',
      label:
        readString(row, 'label') ||
        VEHICLE_TYPE_LABELS[vehicleType as VehicleType] ||
        vehicleType ||
        'Khác',
      count: readNumber(row, 'count', 'bookings', 'total'),
    }
  })
}

export function mapWashBayPerformanceRows(
  data: Record<string, unknown>,
): WashBayPerformanceRow[] {
  const items = readArray(
    data,
    'wash_bays',
    'washBays',
    'wash_bay_stats',
    'washBayStats',
    'rows',
    'bays',
  )

  return items.map((item, index) => {
    const row = (item ?? {}) as Record<string, unknown>
    const garage = readRecord(row, 'garage')
    const washBay = readRecord(row, 'wash_bay', 'washBay')

    return {
      bay_id: readString(row, 'bay_id', 'bayId', 'id') || readString(washBay, 'id') || `bay-${index}`,
      bay_code:
        readString(row, 'bay_code', 'bayCode') || readString(washBay, 'bay_code', 'bayCode') || '—',
      bay_name: readString(row, 'bay_name', 'bayName', 'name') || readString(washBay, 'name') || '—',
      garage_name:
        readString(row, 'garage_name', 'garageName') ||
        readString(garage, 'name') ||
        '—',
      utilization_percent: readNumber(
        row,
        'utilization_percent',
        'utilizationPercent',
        'utilization',
      ),
      sessions_today: readNumber(row, 'sessions_today', 'sessionsToday', 'sessions'),
      avg_session_minutes: readNumber(
        row,
        'avg_session_minutes',
        'avgSessionMinutes',
        'average_session_minutes',
      ),
      avg_wait_minutes: readNumber(
        row,
        'avg_wait_minutes',
        'avgWaitMinutes',
        'average_wait_minutes',
      ),
    }
  })
}
