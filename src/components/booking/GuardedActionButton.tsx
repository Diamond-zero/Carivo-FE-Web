import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import type { ActionGuardResult } from '../../utils/bookingActionGuards'
import { Button, type ButtonProps } from '../ui/Button'

interface GuardedActionButtonProps extends ButtonProps {
  guard: ActionGuardResult
  children: ReactNode
  hintClassName?: string
  showHint?: boolean
}

export function GuardedActionButton({
  guard,
  children,
  disabled,
  title,
  hintClassName,
  showHint = true,
  fullWidth,
  className,
  ...props
}: GuardedActionButtonProps) {
  const isDisabled = disabled || !guard.allowed
  const hint = !guard.allowed ? guard.reason : undefined

  return (
    <div className={cn(fullWidth && 'w-full')}>
      <Button
        {...props}
        fullWidth={fullWidth}
        className={className}
        disabled={isDisabled}
        title={hint ?? title}
      >
        {children}
      </Button>
      {showHint && hint ? (
        <p className={cn('mt-1.5 text-xs text-slate-500', hintClassName)}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
