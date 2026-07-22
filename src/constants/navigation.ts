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
   * hiển thị (ví dụ: Dashboard, Settings). FE lọc qua `useMyCapabilities()`
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
    // Không set requiredCapability ở đây — mỗi child tự check capability riêng.
    // Nếu staff không có capability nào trong children thì children ẩn
    // nhưng group vẫn hiển thị để user biết có mục Bookings.
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
        requiredCapability: 'booking.walk_in.create',
      },
    ],
  },
  {
    label: 'Thực hiện dịch vụ',
    path: '/service/execution',
    icon: Wrench,
    section: 'operations',
    requiredCapability: 'service_task.wash.execute_assigned',
  },
  {
    label: 'Kiểm tra xe',
    path: '/service/inspection',
    icon: Search,
    section: 'operations',
    requiredCapability: 'inspection.create_assigned',
  },
  {
    label: 'Camera cổng',
    path: '/staff/arrivals',
    icon: CameraIcon,
    section: 'operations',
    requiredCapability: 'booking.plate_scan',
  },
  {
    label: 'Danh sách chờ',
    path: '/staff/waitlists',
    icon: Hourglass,
    section: 'operations',
    requiredCapability: 'waitlist.manage_garage',
  },
  {
    label: 'Hồ sơ khiếu nại',
    path: '/staff/cases',
    icon: AlertTriangle,
    section: 'records',
    requiredCapability: 'customer_case.read_garage',
  },
  {
    label: 'Voucher bồi thường',
    path: '/staff/vouchers',
    icon: Ticket,
    section: 'records',
    requiredCapability: 'incident.compensation.issue',
  },
  {
    label: 'Lịch sử rửa',
    path: '/history/wash',
    icon: History,
    section: 'records',
    requiredCapability: 'wash_history.read_garage',
  },
  {
    label: 'Thông tin khách hàng',
    path: '/customers',
    icon: Users,
    section: 'records',
    requiredCapability: 'customer.read_garage',
  },
  {
    label: 'Cài đặt',
    path: '/settings',
    icon: Settings,
    section: 'system',
  },
]
