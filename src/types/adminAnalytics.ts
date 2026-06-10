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
