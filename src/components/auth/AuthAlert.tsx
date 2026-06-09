import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface AuthAlertProps {
  variant?: 'error' | 'success' | 'info'
  children: React.ReactNode
  className?: string
}

const variants = {
  error: {
    wrap: 'border-red-200/80 bg-red-50/90 text-red-800',
    icon: AlertCircle,
  },
  success: {
    wrap: 'border-emerald-200/80 bg-emerald-50/90 text-emerald-800',
    icon: CheckCircle2,
  },
  info: {
    wrap: 'border-brand-200/80 bg-brand-50/60 text-brand-900',
    icon: CheckCircle2,
  },
}

export function AuthAlert({
  variant = 'error',
  children,
  className,
}: AuthAlertProps) {
  const config = variants[variant]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
        config.wrap,
        className,
      )}
      role="alert"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="leading-relaxed">{children}</p>
    </div>
  )
}
