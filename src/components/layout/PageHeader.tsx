import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  eyebrow?: string
}

export function PageHeader({
  title,
  description,
  action,
  className,
  eyebrow = 'Carivo Staff',
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">
          {eyebrow}
        </p>
        <h1 className="carivo-page-title">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="w-full shrink-0 md:w-auto">{action}</div> : null}
    </div>
  )
}
