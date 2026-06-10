import { LayoutDashboard, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import {
  ADMIN_NAV_SECTION_LABELS,
  ADMIN_NAV_SECTION_ORDER,
  adminNavItems,
} from '../../../constants/adminNavigation'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { cn } from '../../../lib/utils'

interface AdminSidebarProps {
  open: boolean
  onClose: () => void
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const { session } = useAdminAuth()

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-navy-950/70 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-navy-950 shadow-[4px_0_24px_rgba(0,0,0,0.18)] transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex h-[4.25rem] shrink-0 items-center gap-3 border-b border-navy-800/80 px-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">Carivo Admin</p>
              <p className="truncate text-[11px] font-medium uppercase tracking-wider text-brand-300/80">
                System Console
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-navy-800 hover:text-white lg:hidden"
              aria-label="Đóng menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-5">
              {ADMIN_NAV_SECTION_ORDER.map((section) => {
                const items = adminNavItems.filter((item) => item.section === section)
                if (items.length === 0) return null

                return (
                  <div key={section}>
                    <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {ADMIN_NAV_SECTION_LABELS[section]}
                    </p>
                    <div className="space-y-0.5">
                      {items.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                              isActive
                                ? 'carivo-sidebar-nav-active text-white before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-brand-400'
                                : 'text-slate-400 hover:bg-navy-800/70 hover:text-slate-100',
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span
                                className={cn(
                                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                  isActive
                                    ? 'bg-brand-500/20 text-brand-300'
                                    : 'bg-navy-800/80 text-slate-400 group-hover:text-slate-200',
                                )}
                              >
                                <item.icon className="h-4 w-4" />
                              </span>
                              {item.label}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </nav>

          {session ? (
            <div className="shrink-0 border-t border-navy-800/80 p-3">
              <div className="rounded-xl border border-navy-700/80 bg-navy-900/70 p-3">
                <p className="truncate text-sm font-semibold text-white">
                  {session.user.full_name}
                </p>
                <p className="text-xs text-violet-300">ADMIN</p>
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  )
}
