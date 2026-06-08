import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'min-h-24 w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400',
            'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-200',
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        ) : null}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
