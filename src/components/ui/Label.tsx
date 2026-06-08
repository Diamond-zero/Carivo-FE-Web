import type { LabelHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export function Label({
  children,
  className,
  required = false,
  ...props
}: LabelProps) {
  return (
    <label
      className={cn('mb-1.5 block text-sm font-medium text-slate-700', className)}
      {...props}
    >
      {children}
      {required ? <span className="ml-0.5 text-red-500">*</span> : null}
    </label>
  )
}
