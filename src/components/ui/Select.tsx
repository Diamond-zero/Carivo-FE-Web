import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, id, children, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          ref={ref}
          id={id}
          className={cn(
            'h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 shadow-[var(--shadow-carivo-sm)] outline-none transition-all',
            'focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-200/90',
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {children}
        </select>
        {error ? (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        ) : null}
      </div>
    )
  },
)

Select.displayName = 'Select'
