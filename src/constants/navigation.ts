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
import type { StaffCapability } from './staffCapabilities'

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
  /**
   * Capability yêu cầu để hiển thị mục này. Mục không có field này luôn
   * hiển thị (ví dụ: Dashboard, Settings). FE lọc qua `useStaffCapabilities()`
   * của Staff hiện tại.
   */
  requiredCapability?: StaffCapability
  children?: Array<{
    label: string
    path: string
    requiredCapability?: StaffCapability
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
    requiredCapability: 'booking.view',
    children: [
      { label: 'Danh sách', path: '/bookings' },
      {
        label: 'Check-in',
        path: '/bookings/check-in',
        requiredCapability: 'booking.check_in',
      },
      {
        label: 'Đặt lịch',
        path: '/bookings/walk-in',
        requiredCapability: 'booking.walk_in',
      },
    ],
  },
  {
    label: 'Thực hiện dịch vụ',
    path: '/service/execution',
    icon: Wrench,
    section: 'operations',
    requiredCapability: 'service.start',
  },
  {
    label: 'Kiểm tra xe',
    path: '/service/inspection',
    icon: Search,
    section: 'operations',
    requiredCapability: 'inspection.create_before',
  },
  {
    label: 'Camera cổng',
    path: '/staff/arrivals',
    icon: CameraIcon,
    section: 'operations',
    requiredCapability: 'arrival.camera.view',
  },
  {
    label: 'Danh sách chờ',
    path: '/staff/waitlists',
    icon: Hourglass,
    section: 'operations',
    requiredCapability: 'waitlist.manage',
  },
  {
    label: 'Hồ sơ khiếu nại',
    path: '/staff/cases',
    icon: AlertTriangle,
    section: 'records',
    requiredCapability: 'case.view',
  },
  {
    label: 'Voucher bồi thường',
    path: '/staff/vouchers',
    icon: Ticket,
    section: 'records',
    requiredCapability: 'voucher.issue',
  },
  {
    label: 'Lịch sử rửa',
    path: '/history/wash',
    icon: History,
    section: 'records',
    requiredCapability: 'wash_history.view',
  },
  {
    label: 'Thông tin khách hàng',
    path: '/customers',
    icon: Users,
    section: 'records',
    requiredCapability: 'customer.view',
  },
  {
    label: 'Cài đặt',
    path: '/settings',
    icon: Settings,
    section: 'system',
  },
]
