import type { LoyaltyTier } from './loyalty'

export interface AnalyticsOverview {
  total_bookings: number
  completed_bookings: number
  total_revenue: number
  active_customers: number
  average_booking_value: number
  tier_distribution: Record<LoyaltyTier, number>
}

export interface DailyBookingStat {
  date: string
  label: string
  bookings: number
  revenue: number
}

export interface RecentBookingRow {
  id: string
  code: string
  customer_name: string
  garage_name: string
  status: string
  final_price: number
  start_time: string
}

export interface MonthlyRevenueStat {
  month: string
  label: string
  revenue: number
}

export interface GarageRevenueStat {
  garage_id: string
  garage_name: string
  revenue: number
  bookings: number
}

export interface BookingStatusStat {
  status: string
  label: string
  count: number
}

export interface VehicleTypeBookingStat {
  vehicle_type: string
  label: string
  count: number
}

export interface WashBayPerformanceRow {
  bay_id: string
  bay_code: string
  bay_name: string
  garage_name: string
  utilization_percent: number
  sessions_today: number
  avg_session_minutes: number
  avg_wait_minutes: number
}
