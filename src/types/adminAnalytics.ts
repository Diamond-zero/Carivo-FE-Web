import type { LoyaltyTier } from './loyalty'
import type { VehicleType } from './washBay'

export interface AnalyticsPeriod {
  from: string | null
  to: string | null
  group_by: 'DAY' | 'WEEK' | 'MONTH'
}

export interface AnalyticsRevenueOverview {
  total_bookings: number
  completed_bookings: number
  canceled_bookings: number
  no_show_bookings: number
  completion_rate: number
  cancellation_rate: number
  no_show_rate: number
  registered_customer_bookings: number
  walk_in_bookings: number
  unique_registered_customers: number
  total_revenue: number
  original_revenue: number
  total_discount: number
  average_order_value: number
  // Legacy fields used by dashboard
  active_customers: number
  average_booking_value: number
  period_from: string
  period_to: string
  group_by: 'DAY' | 'WEEK' | 'MONTH'
  tier_distribution: Record<LoyaltyTier, number>
}

export interface AnalyticsBookingOverview {
  total_bookings: number
  completed_bookings: number
  canceled_bookings: number
  no_show_bookings: number
  completion_rate: number
  cancellation_rate: number
  no_show_rate: number
  scheduled_duration_average_minutes: number
  actual_duration_average_minutes: number
  late_booking_count: number
  reschedule_count: number
  walk_in_bookings: number
  registered_customer_bookings: number
}

export interface AnalyticsCustomerAccountMetrics {
  total_customers: number
  new_customers: number
  active_accounts: number
  locked_accounts: number
  verified_accounts: number
  verification_rate: number
}

export interface AnalyticsCustomerFunnel {
  registered_customers: number
  activated_customers: number
  registered_without_paid_visit: number
  repeat_customers: number
  activation_rate: number
  repeat_rate: number
  average_days_to_first_paid_visit: number
}

export interface AnalyticsCustomerBookingSegment {
  bookings: number
  share: number
  completed_bookings: number
  completion_rate: number
}

export interface AnalyticsCustomerBookingMix {
  total_bookings: number
  walk_in: AnalyticsCustomerBookingSegment
  registered_customer: AnalyticsCustomerBookingSegment
}

export interface AnalyticsCustomerValueMetrics {
  unique_paying_customers: number
  total_paid_visits: number
  total_revenue: number
  average_order_value: number
  average_paid_visits_per_customer: number
  registered_paid_visits: number
  walk_in_paid_visits: number
  registered_revenue: number
  walk_in_revenue: number
}

export interface AnalyticsCustomerActivityRow {
  key: 'ONE_TIME' | 'REPEAT' | 'LOYAL' | string
  label: string
  count: number
}

export interface AnalyticsCustomerRankingRow {
  customer_id: string
  full_name: string
  is_active: boolean
  total_visits: number
  total_spent: number
  average_order_value: number
  distinct_service_count: number
  favorite_service: {
    id: string
    name: string
    usage_count: number
  }
  last_visit_at: string | null
}

export interface AnalyticsCustomerTopLists {
  by_visits: AnalyticsCustomerRankingRow[]
  by_spending: AnalyticsCustomerRankingRow[]
  by_service_variety: AnalyticsCustomerRankingRow[]
  single_service_repeat: AnalyticsCustomerRankingRow[]
}

export interface AnalyticsCustomerData {
  accountMetrics: AnalyticsCustomerAccountMetrics
  funnel: AnalyticsCustomerFunnel
  registrationTrend: AnalyticsTrendPoint[]
  bookingMix: AnalyticsCustomerBookingMix
  valueMetrics: AnalyticsCustomerValueMetrics
  activityDistribution: AnalyticsCustomerActivityRow[]
  topCustomers: AnalyticsCustomerTopLists
  generatedAt: string
}

export interface AnalyticsRevenueMetrics {
  paid_booking_count: number
  net_revenue: number
  total_revenue: number
  original_revenue: number
  total_discount: number
  average_order_value: number
}

export interface AnalyticsWashBayMetrics {
  assigned_booking_count: number
  occupied_minutes: number
  estimated_utilization: number
}

export interface AnalyticsPromotionOverview {
  consumed_usage_count: number
  unique_customer_count: number
  walk_in_usage_count: number
  total_discount: number
  promoted_booking_revenue: number
  average_discount: number
}

export interface AnalyticsTrendPoint {
  period: string
  label: string
  count: number
  revenue: number
}

export interface AnalyticsDayPoint {
  date: string
  label: string
  bookings: number
  revenue: number
}

export interface AnalyticsStatusDistributionRow {
  status: string
  label: string
  count: number
  sort_index?: number
}

export interface AnalyticsVehicleTypeDistributionRow {
  vehicle_type: VehicleType | string
  label: string
  count: number
}

export interface AnalyticsRevenueDistributionRow {
  id: string
  label: string
  count: number
  revenue: number
}

export interface AnalyticsWashBayPerformanceRow {
  bay_id: string
  bay_code: string
  bay_name: string
  garage_id: string
  garage_name: string
  booking_count: number
  occupied_minutes: number
  estimated_utilization: number
  revenue: number
  average_service_duration_minutes: number
}

export interface AnalyticsGaragePerformanceRow {
  garage_id: string
  garage_name: string
  garage_code: string
  total_bookings: number
  completed_bookings: number
  canceled_bookings: number
  no_show_bookings: number
  completion_rate: number
  cancellation_rate: number
  no_show_rate: number
  scheduled_duration_average_minutes: number
  actual_duration_average_minutes: number
  total_revenue: number
  average_order_value: number
}

export interface AnalyticsServicePerformanceRow {
  service_package_id: string
  service_name: string
  service_code: string
  total_bookings: number
  completed_bookings: number
  canceled_bookings: number
  no_show_bookings: number
  completion_rate: number
  total_revenue: number
  average_order_value: number
  scheduled_duration_average_minutes: number
  actual_duration_average_minutes: number
}

export interface AnalyticsPromotionsPerformanceRow {
  promotion_id: string
  promotion_name: string
  code: string
  total_uses: number
  total_discount: number
  total_revenue: number
  average_discount: number
}

/* ---------- Legacy aliases (kept for the dashboard) ---------- */
export type RecentBookingRow = {
  id: string
  code: string
  customer_name: string
  garage_name: string
  status: string
  final_price: number
  start_time: string
}

export type MonthlyRevenueStat = AnalyticsDayPoint
export type GarageRevenueStat = AnalyticsRevenueDistributionRow
export type BookingStatusStat = AnalyticsStatusDistributionRow
export type VehicleTypeBookingStat = AnalyticsVehicleTypeDistributionRow
export type WashBayPerformanceRow = AnalyticsWashBayPerformanceRow
export type GaragePerformanceRow = AnalyticsGaragePerformanceRow
export type ServicePerformanceRow = AnalyticsServicePerformanceRow
export type PromotionPerformanceRow = AnalyticsPromotionsPerformanceRow
export type AnalyticsOverview = AnalyticsRevenueOverview
export type DailyBookingStat = AnalyticsDayPoint
