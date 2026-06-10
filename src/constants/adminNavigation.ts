import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Settings, Users } from 'lucide-react'

export type AdminNavSection = 'overview' | 'management' | 'system'

export const ADMIN_NAV_SECTION_ORDER: AdminNavSection[] = [
  'overview',
  'management',
  'system',
]

export const ADMIN_NAV_SECTION_LABELS: Record<AdminNavSection, string> = {
  overview: 'Tổng quan',
  management: 'Quản lý',
  system: 'Hệ thống',
}

export interface AdminNavItem {
  label: string
  path: string
  icon: LucideIcon
  section: AdminNavSection
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
    path: '/admin/users',
    icon: Users,
    section: 'management',
  },
  {
    label: 'Cài đặt',
    path: '/admin/settings',
    icon: Settings,
    section: 'system',
  },
]
