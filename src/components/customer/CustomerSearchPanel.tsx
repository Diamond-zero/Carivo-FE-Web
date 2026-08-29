import { Search, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface CustomerSearchPanelProps {
  query: string
  onChange: (query: string) => void
  onReset: () => void
  label?: string
  placeholder?: string
  inputId?: string
}

export function CustomerSearchPanel({
  query,
  onChange,
  onReset,
  label = 'Tìm khách hàng',
  placeholder = 'Tên, SĐT, email hoặc biển số...',
  inputId = 'customer-search',
}: CustomerSearchPanelProps) {
  return (
    <div className="carivo-panel p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id={inputId}
              value={query}
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              className="pl-10"
            />
          </div>
        </div>
        {query ? (
          <Button type="button" variant="secondary" onClick={onReset}>
            <X className="h-4 w-4" />
            Xóa lọc
          </Button>
        ) : null}
      </div>
    </div>
  )
}
