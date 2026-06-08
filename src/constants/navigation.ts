import type { LucideIcon } from 'lucide-react'
import {
  Camera,
  ClipboardList,
  History,
  LayoutDashboard,
  Settings,
  Users,
  Wrench,
} from 'lucide-react'

export type NavSection = 'operations' | 'records' | 'system'

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

export const NAV_SECTION_LABELS: Record<NavSection, string> = {
  operations: 'Vận hành',
  records: 'Lưu trữ',
  system: 'Hệ thống',
}

export const NAV_SECTION_ORDER: NavSection[] = ['operations', 'records', 'system']

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
      { label: 'Walk-in mới', path: '/bookings/walk-in' },
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
    icon: Camera,
    section: 'operations',
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
