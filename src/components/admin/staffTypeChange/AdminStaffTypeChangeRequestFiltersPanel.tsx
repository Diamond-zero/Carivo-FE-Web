import { RotateCcw } from 'lucide-react'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Select } from '../../ui/Select'
import {
  ADMIN_STAFF_TYPE_CHANGE_SOURCE_OPTIONS,
  ADMIN_STAFF_TYPE_CHANGE_STATUS_OPTIONS,
  type AdminStaffTypeChangeRequestFilters,
} from './AdminStaffTypeChangeRequestFilters.helpers'

interface AdminStaffTypeChangeRequestFiltersPanelProps {
  filters: AdminStaffTypeChangeRequestFilters
  onChange: (next: AdminStaffTypeChangeRequestFilters) => void
  onReset: () => void
}

export function AdminStaffTypeChangeRequestFiltersPanel({
  filters,
  onChange,
  onReset,
}: AdminStaffTypeChangeRequestFiltersPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-carivo-sm)]">
      <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px_auto]">
        <div>
          <Label htmlFor="query">Tìm theo mã NV / mã yêu cầu</Label>
          <Input
            id="query"
            placeholder="VD: STF001 hoặc mã yêu cầu"
            value={filters.query}
            onChange={(event) =>
              onChange({ ...filters, query: event.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="status">Trạng thái</Label>
          <Select
            id="status"
            value={filters.status}
            onChange={(event) =>
              onChange({ ...filters, status: event.target.value })
            }
          >
            {ADMIN_STAFF_TYPE_CHANGE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="source">Nguồn yêu cầu</Label>
          <Select
            id="source"
            value={filters.source}
            onChange={(event) =>
              onChange({
                ...filters,
                source: event.target.value as AdminStaffTypeChangeRequestFilters['source'],
              })
            }
          >
            {ADMIN_STAFF_TYPE_CHANGE_SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            Xóa bộ lọc
          </Button>
        </div>
      </div>
    </div>
  )
}
