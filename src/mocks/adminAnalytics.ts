import type {
  AnalyticsOverview,
  DailyBookingStat,
  RecentBookingRow,
} from '../types/adminAnalytics'

export const mockAnalyticsOverview: AnalyticsOverview = {
  total_bookings: 1284,
  completed_bookings: 1096,
  total_revenue: 428500000,
  active_customers: 312,
  average_booking_value: 334000,
  tier_distribution: {
    BRONZE: 142,
    SILVER: 98,
    GOLD: 52,
    PLATINUM: 20,
  },
}

export const mockDailyBookingStats: DailyBookingStat[] = [
  { date: '2026-06-04', label: 'T2', bookings: 38, revenue: 12400000 },
  { date: '2026-06-05', label: 'T3', bookings: 45, revenue: 15100000 },
  { date: '2026-06-06', label: 'T4', bookings: 52, revenue: 17800000 },
  { date: '2026-06-07', label: 'T5', bookings: 41, revenue: 13200000 },
  { date: '2026-06-08', label: 'T6', bookings: 63, revenue: 21500000 },
  { date: '2026-06-09', label: 'T7', bookings: 71, revenue: 24800000 },
  { date: '2026-06-10', label: 'CN', bookings: 58, revenue: 19600000 },
]

export const mockRecentAdminBookings: RecentBookingRow[] = [
  {
    id: 'booking-101',
    code: 'BK-2026-101',
    customer_name: 'Nguyễn Minh Tuấn',
    garage_name: 'Carivo FPT Hòa Lạc',
    status: 'IN_PROGRESS',
    final_price: 350000,
    start_time: '2026-06-10T09:30:00',
  },
  {
    id: 'booking-102',
    code: 'BK-2026-102',
    customer_name: 'Trần Thị Lan',
    garage_name: 'Carivo Cầu Giấy',
    status: 'CONFIRMED',
    final_price: 280000,
    start_time: '2026-06-10T10:00:00',
  },
  {
    id: 'booking-103',
    code: 'BK-2026-103',
    customer_name: 'Hoàng Văn Em',
    garage_name: 'Carivo Thủ Đức',
    status: 'COMPLETED',
    final_price: 420000,
    start_time: '2026-06-10T08:00:00',
  },
  {
    id: 'booking-104',
    code: 'BK-2026-104',
    customer_name: 'Khách walk-in',
    garage_name: 'Carivo FPT Hòa Lạc',
    status: 'CHECKED_IN',
    final_price: 190000,
    start_time: '2026-06-10T11:15:00',
  },
  {
    id: 'booking-105',
    code: 'BK-2026-105',
    customer_name: 'Phạm Thu Hà',
    garage_name: 'Carivo Cầu Giấy',
    status: 'COMPLETED',
    final_price: 510000,
    start_time: '2026-06-09T16:30:00',
  },
]
