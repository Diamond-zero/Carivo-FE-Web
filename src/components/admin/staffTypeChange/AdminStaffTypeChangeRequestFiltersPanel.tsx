import { RotateCcw } from 'lucide-react'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Select } from '../../ui/Select'

export interface AdminStaffTypeChangeRequestFilters {
  query: string
  status: string
}

export const DEFAULT_ADMIN_STAFF_TYPE_CHANGE_REQUEST_FILTERS: AdminStaffTypeChangeRequestFilters =
  {
    query: '',
    status: 'ALL',
  }

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'REQUESTED', label: 'Đang chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'SCHEDULED', label: 'Đã lên lịch' },
  { value: 'APPLIED', label: 'Đã áp dụng' },
  { value: 'REJECTED', label: 'Bị từ chối' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'FAILED', label: 'Thất bại' },
]

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
      <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto]">
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
            {STATUS_OPTIONS.map((opt) => (
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

export function hasActiveAdminStaffTypeChangeRequestFilters(
  filters: AdminStaffTypeChangeRequestFilters,
) {
  return filters.query.trim().length > 0 || filters.status !== 'ALL'
}

export function filterAdminStaffTypeChangeRequests<
  T extends { id: string; staff_profile_id: string; status: string },
>(filters: AdminStaffTypeChangeRequestFilters, requests: T[]): T[] {
  const q = filters.query.trim().toLowerCase()
  return requests.filter((req) => {
    if (filters.status !== 'ALL' && req.status !== filters.status) {
      return false
    }
    if (!q) return true
    return (
      req.id.toLowerCase().includes(q) ||
      req.staff_profile_id.toLowerCase().includes(q)
    )
  })
}
