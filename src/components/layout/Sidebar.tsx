import { ChevronDown, ChevronRight, Droplets, MapPin, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  NAV_SECTION_LABELS,
  NAV_SECTION_ORDER,
  staffNavItems,
  type StaffNavItem,
} from '../../constants/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

function isPathActive(currentPath: string, targetPath: string) {
  if (targetPath === '/dashboard') {
    return currentPath === targetPath
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}

function navLinkClass(active: boolean) {
  return cn(
    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
    active
      ? 'carivo-sidebar-nav-active before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-brand-400'
      : 'text-slate-400 hover:bg-navy-800/70 hover:text-slate-100',
  )
}

function NavItemContent({ item, active }: { item: StaffNavItem; active: boolean }) {
  return (
    <>
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
          active
            ? 'bg-brand-500/20 text-brand-300'
            : 'bg-navy-800/80 text-slate-400 group-hover:text-slate-200',
        )}
      >
        <item.icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-left">{item.label}</span>
    </>
  )
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation()
  const { session } = useAuth()
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])

  useEffect(() => {
    if (location.pathname.startsWith('/bookings')) {
      setExpandedGroups((current) =>
        current.includes('Bookings') ? current : [...current, 'Bookings'],
      )
    }
  }, [location.pathname])

  const toggleGroup = (label: string) => {
    setExpandedGroups((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    )
  }

  const renderNavItem = (item: StaffNavItem) => {
    if (item.children) {
      const isExpanded = expandedGroups.includes(item.label)
      const isGroupActive = item.children.some((child) =>
        isPathActive(location.pathname, child.path),
      )

      return (
        <div key={item.label} className="space-y-1">
          <button
            type="button"
            onClick={() => toggleGroup(item.label)}
            className={cn(navLinkClass(isGroupActive), 'w-full')}
          >
            <NavItemContent item={item} active={isGroupActive} />
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
            )}
          </button>

          {isExpanded ? (
            <div className="ml-5 space-y-0.5 border-l border-navy-700/80 pl-3">
              {item.children.map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-lg px-3 py-2 text-sm transition-all',
                      isActive
                        ? 'bg-brand-500/20 font-semibold text-brand-200'
                        : 'text-slate-500 hover:bg-navy-800/60 hover:text-slate-200',
                    )
                  }
                >
                  {child.label}
                </NavLink>
              ))}
            </div>
          ) : null}
        </div>
      )
    }

    return (
      <NavLink
        key={item.path}
        to={item.path!}
        onClick={onClose}
        className={({ isActive }) => navLinkClass(isActive)}
      >
        {({ isActive }) => <NavItemContent item={item} active={isActive} />}
      </NavLink>
    )
  }

  const navContent = (
    <div className="relative flex h-full min-h-0 flex-col bg-navy-950">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 0%, rgba(6,182,164,0.18), transparent 45%), radial-gradient(circle at 100% 100%, rgba(6,182,164,0.08), transparent 40%)',
        }}
        aria-hidden
      />

      <div className="relative shrink-0 flex h-[4.25rem] items-center gap-3 border-b border-navy-800/80 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg shadow-brand-900/40">
          <Droplets className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-white">
            Carivo Staff
          </p>
          <p className="truncate text-[11px] font-medium uppercase tracking-wider text-brand-300/80">
            Operations Console
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="relative ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-navy-800 hover:text-white lg:hidden"
          aria-label="Đóng menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="sidebar-scroll relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4">
        <div className="space-y-5 pb-2">
          {NAV_SECTION_ORDER.map((section) => {
            const sectionItems = staffNavItems.filter(
              (item) => item.section === section,
            )
            if (sectionItems.length === 0) return null

            return (
              <div key={section}>
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  {NAV_SECTION_LABELS[section]}
                </p>
                <div className="space-y-0.5">{sectionItems.map(renderNavItem)}</div>
              </div>
            )
          })}
        </div>
      </nav>

      {session ? (
        <div className="relative shrink-0 border-t border-navy-800/80 bg-navy-950 p-3">
          <Link
            to="/settings"
            onClick={onClose}
            className="block rounded-xl border border-navy-700/80 bg-navy-900/70 p-3 transition-colors hover:border-brand-500/30 hover:bg-navy-800/80"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-sm font-bold text-brand-300">
                {session.user.full_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {session.user.full_name}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {session.staffProfile.staff_code}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-400/80" />
              <span className="truncate">{session.garage.name}</span>
            </div>
          </Link>
        </div>
      ) : null}
    </div>
  )

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-navy-950/70 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[17.5rem] bg-navy-950 shadow-[4px_0_24px_rgba(0,0,0,0.18)] transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {navContent}
      </aside>
    </>
  )
}
