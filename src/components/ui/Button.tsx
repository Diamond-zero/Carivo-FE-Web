import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-[0_1px_2px_rgba(6,182,164,0.35),0_4px_12px_rgba(6,182,164,0.2)] hover:from-brand-600 hover:to-brand-700 focus-visible:ring-brand-500',
  secondary:
    'border border-slate-200/90 bg-white text-slate-700 shadow-[var(--shadow-carivo-sm)] hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-300',
  ghost: 'text-slate-600 hover:bg-slate-100/80 focus-visible:ring-slate-300',
  danger:
    'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-400',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  )
}
