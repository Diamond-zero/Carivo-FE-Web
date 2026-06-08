import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Button } from './Button'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Đóng panel"
        className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={cn(
          'absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-slate-200/80 bg-white shadow-[var(--shadow-carivo-lg)]',
          className,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white px-5 py-4">
          <div className="min-w-0">
            <h2
              id="drawer-title"
              className="truncate text-lg font-bold tracking-tight text-slate-900"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={onClose}
            aria-label="Đóng panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer ? (
          <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>
  )
}
