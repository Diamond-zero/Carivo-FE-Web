import type { LucideIcon } from 'lucide-react'
import {
  ArrowRightLeft,
  BarChart3,
  Building2,
  CircleDollarSign,
  ClipboardList,
  FileSearch,
  FolderKanban,
  Gift,
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Package,
  ScanLine,
  ScrollText,
  Settings,
  Star,
  Ticket,
  Users,
} from 'lucide-react'

export type AdminNavSection = 'overview' | 'management' | 'insights' | 'system'

export const ADMIN_NAV_SECTION_ORDER: AdminNavSection[] = [
  'overview',
  'management',
  'insights',
  'system',
]

export const ADMIN_NAV_SECTION_LABELS: Record<AdminNavSection, string> = {
  overview: 'Tổng quan',
  management: 'Quản lý',
  insights: 'Phân tích & nghiên cứu',
  system: 'Hệ thống',
}

export interface AdminNavChild {
  label: string
  path: string
}

export interface AdminNavItem {
  label: string
  path?: string
  icon: LucideIcon
  section: AdminNavSection
  children?: AdminNavChild[]
}

export const adminNavItems: AdminNavItem[] = [
  {
    label: 'Bảng điều khiển',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
    section: 'overview',
  },
  {
    label: 'Người dùng',
    icon: Users,
    section: 'management',
    children: [
      { label: 'Tất cả', path: '/admin/users/all' },
      { label: 'Khách hàng', path: '/admin/users/customers' },
      { label: 'Nhân viên', path: '/admin/users/staff' },
    ],
  },
  {
    label: 'Garage',
    icon: Building2,
    section: 'management',
    children: [
      { label: 'Danh sách garage', path: '/admin/garages' },
      { label: 'Buồng rửa', path: '/admin/garages/wash-bays' },
    ],
  },
  {
    label: 'Gói dịch vụ',
    icon: Package,
    section: 'management',
    children: [
      { label: 'Danh sách gói', path: '/admin/services/packages' },
      { label: 'Bảng giá phân loại', path: '/admin/services/prices' },
    ],
  },
  {
    label: 'Đặt lịch',
    icon: ClipboardList,
    section: 'management',
    children: [
      { label: 'Danh sách booking', path: '/admin/bookings' },
      { label: 'Lịch sử rửa', path: '/admin/wash-histories' },
      { label: 'Điểm vi phạm', path: '/admin/booking-violations' },
    ],
  },
  {
    label: 'Vận hành cổng',
    icon: ScanLine,
    section: 'management',
    children: [
      { label: 'Camera cổng', path: '/admin/arrivals/cameras' },
      { label: 'Lượt quét biển số', path: '/admin/arrivals/scans' },
      { label: 'Metrics nhận diện', path: '/admin/arrivals/metrics' },
    ],
  },
  {
    label: 'Loyalty',
    icon: Star,
    section: 'management',
    children: [
      { label: 'Quy tắc hạng', path: '/admin/loyalty/tier-rules' },
      { label: 'Tổng quan điểm', path: '/admin/loyalty/overview' },
    ],
  },
  {
    label: 'Khuyến mãi',
    path: '/admin/promotions',
    icon: Gift,
    section: 'management',
  },
  {
    label: 'Thanh toán',
    path: '/admin/payments',
    icon: CircleDollarSign,
    section: 'management',
  },
  {
    label: 'Voucher bồi thường',
    path: '/admin/customer-vouchers',
    icon: Ticket,
    section: 'management',
  },
  {
    label: 'Hồ sơ khiếu nại',
    path: '/admin/customer-cases',
    icon: FolderKanban,
    section: 'management',
  },
  {
    label: 'Đánh giá khách hàng',
    path: '/admin/reviews',
    icon: MessagesSquare,
    section: 'management',
  },
  {
    label: 'Đổi chức năng nhân viên',
    icon: ArrowRightLeft,
    section: 'management',
    children: [
      { label: 'Yêu cầu đổi loại nhân viên', path: '/admin/staff-type-change-requests' },
      { label: 'Lịch sử đổi', path: '/admin/staff-type-change-history' },
    ],
  },
  {
    label: 'Phân tích',
    icon: BarChart3,
    section: 'insights',
    children: [
      { label: 'Doanh thu', path: '/admin/analytics/revenue' },
      { label: 'Booking', path: '/admin/analytics/bookings' },
      { label: 'Khách hàng', path: '/admin/analytics/customers' },
      { label: 'Hiệu suất buồng rửa', path: '/admin/analytics/wash-bay' },
      { label: 'Hiệu suất chi nhánh', path: '/admin/analytics/garages' },
      { label: 'Hiệu suất gói dịch vụ', path: '/admin/analytics/services' },
      { label: 'Hiệu quả khuyến mãi', path: '/admin/analytics/promotions' },
    ],
  },
  {
    label: 'Xuất dữ liệu',
    path: '/admin/research/export',
    icon: FileSearch,
    section: 'insights',
  },
  {
    label: 'Khảo sát',
    path: '/admin/surveys',
    icon: MessageSquare,
    section: 'insights',
  },
  {
    label: 'Nhật ký hệ thống',
    path: '/admin/audit-logs',
    icon: ScrollText,
    section: 'system',
  },
  {
    label: 'Cài đặt',
    path: '/admin/settings',
    icon: Settings,
    section: 'system',
  },
]

export const ADMIN_NAV_EXPAND_PREFIXES: Array<{
  prefix: string
  groupLabel: string
}> = [
  { prefix: '/admin/users', groupLabel: 'Người dùng' },
  { prefix: '/admin/garages', groupLabel: 'Garage' },
  { prefix: '/admin/services', groupLabel: 'Gói dịch vụ' },
  { prefix: '/admin/bookings', groupLabel: 'Đặt lịch' },
  { prefix: '/admin/wash-histories', groupLabel: 'Đặt lịch' },
  { prefix: '/admin/booking-violations', groupLabel: 'Đặt lịch' },
  { prefix: '/admin/loyalty', groupLabel: 'Loyalty' },
  { prefix: '/admin/analytics', groupLabel: 'Phân tích' },
  { prefix: '/admin/staff-type-change-requests', groupLabel: 'Đổi chức năng nhân viên' },
  { prefix: '/admin/staff-type-change-history', groupLabel: 'Đổi chức năng nhân viên' },
  { prefix: '/admin/customer-vouchers', groupLabel: 'Voucher bồi thường' },
  { prefix: '/admin/customer-cases', groupLabel: 'Hồ sơ khiếu nại' },
  { prefix: '/admin/reviews', groupLabel: 'Đánh giá khách hàng' },
  { prefix: '/admin/arrivals', groupLabel: 'Vận hành cổng' },
  { prefix: '/admin/payments', groupLabel: 'Thanh toán' },
]
