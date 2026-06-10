import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileSearch,
  Gift,
  LayoutDashboard,
  MessageSquare,
  Package,
  ScrollText,
  Settings,
  Star,
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
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
    section: 'overview',
  },
  {
    label: 'Users',
    icon: Users,
    section: 'management',
    children: [
      { label: 'Khách hàng', path: '/admin/users/customers' },
      { label: 'Nhân viên', path: '/admin/users/staff' },
    ],
  },
  {
    label: 'Garages',
    icon: Building2,
    section: 'management',
    children: [
      { label: 'Danh sách', path: '/admin/garages' },
      { label: 'Buồng rửa', path: '/admin/garages/wash-bays' },
    ],
  },
  {
    label: 'Service Packages',
    path: '/admin/services/packages',
    icon: Package,
    section: 'management',
  },
  {
    label: 'Bookings',
    path: '/admin/bookings',
    icon: ClipboardList,
    section: 'management',
  },
  {
    label: 'Loyalty',
    icon: Star,
    section: 'management',
    children: [
      { label: 'Tier Rules', path: '/admin/loyalty/tier-rules' },
      { label: 'Overview', path: '/admin/loyalty/overview' },
    ],
  },
  {
    label: 'Promotions',
    path: '/admin/promotions',
    icon: Gift,
    section: 'management',
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    section: 'insights',
    children: [
      { label: 'Revenue', path: '/admin/analytics/revenue' },
      { label: 'Bookings', path: '/admin/analytics/bookings' },
      { label: 'WashBay Performance', path: '/admin/analytics/wash-bay' },
    ],
  },
  {
    label: 'Research Export',
    path: '/admin/research/export',
    icon: FileSearch,
    section: 'insights',
  },
  {
    label: 'Surveys',
    path: '/admin/surveys',
    icon: MessageSquare,
    section: 'insights',
  },
  {
    label: 'Audit Logs',
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

/** Path prefixes that auto-expand matching sidebar groups. */
export const ADMIN_NAV_EXPAND_PREFIXES: Array<{
  prefix: string
  groupLabel: string
}> = [
  { prefix: '/admin/users', groupLabel: 'Users' },
  { prefix: '/admin/garages', groupLabel: 'Garages' },
  { prefix: '/admin/loyalty', groupLabel: 'Loyalty' },
  { prefix: '/admin/analytics', groupLabel: 'Analytics' },
]
