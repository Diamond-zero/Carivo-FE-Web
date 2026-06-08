import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          id={id}
          className={cn(
            'h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 shadow-[var(--shadow-carivo-sm)] outline-none transition-all placeholder:text-slate-400',
            'focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-200/90',
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {error ? (
          <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)

Input.displayName = 'Input'
