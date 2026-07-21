import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Camera as CameraIcon,
  ClipboardList,
  History,
  Hourglass,
  LayoutDashboard,
  Search,
  Settings,
  Ticket,
  Users,
  Wrench,
} from 'lucide-react'

export type NavSection = 'operations' | 'records' | 'system'

export const NAV_SECTION_ORDER: NavSection[] = ['operations', 'records', 'system']

export const NAV_SECTION_LABELS: Record<NavSection, string> = {
  operations: 'Vận hành',
  records: 'Lưu trữ',
  system: 'Hệ thống',
}

export interface StaffNavItem {
  label: string
  path?: string
  icon: LucideIcon
  section: NavSection
  children?: Array<{
    label: string
    path: string
  }>
}

export const staffNavItems: StaffNavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    section: 'operations',
  },
  {
    label: 'Bookings',
    icon: ClipboardList,
    section: 'operations',
    children: [
      { label: 'Danh sách', path: '/bookings' },
      { label: 'Check-in', path: '/bookings/check-in' },
      { label: 'Đặt lịch', path: '/bookings/walk-in' },
    ],
  },
  {
    label: 'Thực hiện dịch vụ',
    path: '/service/execution',
    icon: Wrench,
    section: 'operations',
  },
  {
    label: 'Kiểm tra xe',
    path: '/service/inspection',
    icon: Search,
    section: 'operations',
  },
  {
    label: 'Camera cổng',
    path: '/staff/arrivals',
    icon: CameraIcon,
    section: 'operations',
  },
  {
    label: 'Danh sách chờ',
    path: '/staff/waitlists',
    icon: Hourglass,
    section: 'operations',
  },
  {
    label: 'Hồ sơ khiếu nại',
    path: '/staff/cases',
    icon: AlertTriangle,
    section: 'records',
  },
  {
    label: 'Voucher bồi thường',
    path: '/staff/vouchers',
    icon: Ticket,
    section: 'records',
  },
  {
    label: 'Lịch sử rửa',
    path: '/history/wash',
    icon: History,
    section: 'records',
  },
  {
    label: 'Thông tin khách hàng',
    path: '/customers',
    icon: Users,
    section: 'records',
  },
  {
    label: 'Cài đặt',
    path: '/settings',
    icon: Settings,
    section: 'system',
  },
]