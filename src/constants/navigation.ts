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

export interface StaffNavItem {
  label: string
  path?: string
  icon: LucideIcon
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
  },
  {
    label: 'Bookings',
    icon: ClipboardList,
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
  },
  {
    label: 'Kiểm tra xe',
    path: '/service/inspection',
    icon: Camera,
  },
  {
    label: 'Lịch sử rửa',
    path: '/history/wash',
    icon: History,
  },
  {
    label: 'Thông tin khách hàng',
    path: '/customers',
    icon: Users,
  },
  {
    label: 'Cài đặt',
    path: '/settings',
    icon: Settings,
  },
]
