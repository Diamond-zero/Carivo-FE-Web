import type {
  AnalyticsOverview,
  BookingStatusStat,
  DailyBookingStat,
  GarageRevenueStat,
  MonthlyRevenueStat,
  RecentBookingRow,
  VehicleTypeBookingStat,
  WashBayPerformanceRow,
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

export const mockMonthlyRevenueStats: MonthlyRevenueStat[] = [
  { month: '2026-01', label: 'T1', revenue: 52000000 },
  { month: '2026-02', label: 'T2', revenue: 61000000 },
  { month: '2026-03', label: 'T3', revenue: 68000000 },
  { month: '2026-04', label: 'T4', revenue: 72000000 },
  { month: '2026-05', label: 'T5', revenue: 78500000 },
  { month: '2026-06', label: 'T6', revenue: 97200000 },
]

export const mockGarageRevenueStats: GarageRevenueStat[] = [
  {
    garage_id: 'garage-fpt-hl-01',
    garage_name: 'Carivo FPT Hòa Lạc',
    revenue: 198500000,
    bookings: 612,
  },
  {
    garage_id: 'garage-q7-hcm-01',
    garage_name: 'Carivo Quận 7',
    revenue: 142300000,
    bookings: 438,
  },
  {
    garage_id: 'garage-dn-haichau-01',
    garage_name: 'Carivo Hải Châu',
    revenue: 87700000,
    bookings: 234,
  },
]

export const mockBookingStatusStats: BookingStatusStat[] = [
  { status: 'COMPLETED', label: 'Hoàn thành', count: 1096 },
  { status: 'IN_PROGRESS', label: 'Đang thực hiện', count: 48 },
  { status: 'CONFIRMED', label: 'Đã xác nhận', count: 62 },
  { status: 'CHECKED_IN', label: 'Đã check-in', count: 31 },
  { status: 'PENDING', label: 'Chờ xác nhận', count: 24 },
  { status: 'CANCELED', label: 'Đã hủy', count: 18 },
  { status: 'NO_SHOW', label: 'Không đến', count: 5 },
]

export const mockVehicleTypeBookingStats: VehicleTypeBookingStat[] = [
  { vehicle_type: 'CAR', label: 'Ô tô', count: 842 },
  { vehicle_type: 'MOTORBIKE', label: 'Xe máy', count: 442 },
]

export const mockWashBayPerformanceRows: WashBayPerformanceRow[] = [
  {
    bay_id: 'bay-001',
    bay_code: 'HL-CAR-01',
    bay_name: 'Buồng ô tô 1',
    garage_name: 'Carivo FPT Hòa Lạc',
    utilization_percent: 78,
    sessions_today: 14,
    avg_session_minutes: 28,
    avg_wait_minutes: 6,
  },
  {
    bay_id: 'bay-002',
    bay_code: 'HL-CAR-02',
    bay_name: 'Buồng ô tô 2',
    garage_name: 'Carivo FPT Hòa Lạc',
    utilization_percent: 65,
    sessions_today: 11,
    avg_session_minutes: 32,
    avg_wait_minutes: 9,
  },
  {
    bay_id: 'bay-q7-car-01',
    bay_code: 'Q7-CAR-01',
    bay_name: 'Buồng Q7 ô tô',
    garage_name: 'Carivo Quận 7',
    utilization_percent: 82,
    sessions_today: 16,
    avg_session_minutes: 26,
    avg_wait_minutes: 12,
  },
  {
    bay_id: 'bay-q7-bike-01',
    bay_code: 'Q7-BIKE-01',
    bay_name: 'Buồng Q7 xe máy',
    garage_name: 'Carivo Quận 7',
    utilization_percent: 71,
    sessions_today: 22,
    avg_session_minutes: 14,
    avg_wait_minutes: 4,
  },
  {
    bay_id: 'bay-dn-car-01',
    bay_code: 'DN-CAR-01',
    bay_name: 'Buồng ĐN ô tô',
    garage_name: 'Carivo Hải Châu',
    utilization_percent: 58,
    sessions_today: 9,
    avg_session_minutes: 30,
    avg_wait_minutes: 8,
  },
  {
    bay_id: 'bay-dn-bike-01',
    bay_code: 'DN-BIKE-01',
    bay_name: 'Buồng ĐN xe máy',
    garage_name: 'Carivo Hải Châu',
    utilization_percent: 54,
    sessions_today: 18,
    avg_session_minutes: 12,
    avg_wait_minutes: 5,
  },
]
