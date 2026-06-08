import type { ReactNode } from 'react'

interface SettingsInfoRowProps {
  label: string
  value: ReactNode
}

export function SettingsInfoRow({ label, value }: SettingsInfoRowProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{value}</dd>
    </div>
  )
}
