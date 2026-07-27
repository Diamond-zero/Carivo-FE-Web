import { Calendar, Filter, RotateCcw, Search, UserCog } from 'lucide-react'
import {
  AUDIT_ACTOR_ROLES,
  AUDIT_ACTOR_ROLE_LABELS,
  AUDIT_RESOURCE_TYPE_LABELS,
  humanizeAuditAction,
} from '../../../constants/auditLog'
import type { AdminAuditLogFilters } from '../../../utils/adminAuditLogLookup'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Select } from '../../ui/Select'
import { cn } from '../../../lib/utils'

interface AdminAuditLogFiltersPanelProps {
  filters: AdminAuditLogFilters
  onChange: (filters: AdminAuditLogFilters) => void
  onReset: () => void
  isLoading?: boolean
}

const RESOURCE_OPTIONS = Object.entries(AUDIT_RESOURCE_TYPE_LABELS)
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'vi'))

export function AdminAuditLogFiltersPanel({
  filters,
  onChange,
  onReset,
  isLoading = false,
}: AdminAuditLogFiltersPanelProps) {
  const update = (patch: Partial<AdminAuditLogFilters>) => {
    onChange({ ...filters, ...patch })
  }

  const hasActiveFilters =
    filters.action.trim() !== '' ||
    filters.resourceType.trim() !== '' ||
    filters.actorRole !== 'ALL' ||
    filters.query.trim() !== '' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== ''

  const resetAll = () => {
    onReset()
  }

  return (
    <div
      className={cn(
        'carivo-panel relative overflow-hidden transition-shadow',
        isLoading && 'ring-1 ring-brand-100/70',
      )}
    >
      <div className="border-b border-slate-100/80 bg-gradient-to-r from-slate-50/80 to-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <Filter className="h-3.5 w-3.5" />
            </span>
            Bộ lọc nhật ký
          </div>
          {hasActiveFilters ? (
            <Button variant="ghost" size="sm" onClick={resetAll}>
              <RotateCcw className="h-4 w-4" />
              Đặt lại
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 px-5 py-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="xl:col-span-2">
          <Label htmlFor="audit-query">Tìm kiếm</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="audit-query"
              className="pl-9"
              placeholder="ID nhật ký, mô tả, từ khoá..."
              value={filters.query}
              onChange={(event) => update({ query: event.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="audit-resource">Đối tượng</Label>
          <Select
            id="audit-resource"
            value={filters.resourceType}
            onChange={(event) =>
              update({ resourceType: event.target.value, page: 1 })
            }
          >
            <option value="">Tất cả đối tượng</option>
            {RESOURCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="audit-action">Hành động</Label>
          <Select
            id="audit-action"
            value={filters.action}
            onChange={(event) =>
              update({ action: event.target.value, page: 1 })
            }
          >
            <option value="">Tất cả hành động</option>
            <option value="CREATE">Tạo mới</option>
            <option value="UPDATE">Cập nhật</option>
            <option value="DELETE">Xoá</option>
            <option value="TOGGLE_STATUS">Đổi trạng thái</option>
            <option value="LOGIN">Đăng nhập</option>
            <option value="EXPORT">Xuất dữ liệu</option>
            <option value="APPROVE">Phê duyệt</option>
            <option value="REJECT">Từ chối</option>
          </Select>
          {filters.action ? (
            <p className="mt-1 text-xs text-slate-500">
              Đang chọn: {humanizeAuditAction(filters.action)}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="audit-role">Vai trò</Label>
          <Select
            id="audit-role"
            value={filters.actorRole}
            onChange={(event) =>
              update({ actorRole: event.target.value, page: 1 })
            }
          >
            <option value="ALL">Tất cả</option>
            {AUDIT_ACTOR_ROLES.map((role) => (
              <option key={role} value={role}>
                {AUDIT_ACTOR_ROLE_LABELS[role]}
              </option>
            ))}
          </Select>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
            <UserCog className="h-3 w-3" />
            Lọc theo vai trò thực hiện
          </p>
        </div>
        <div>
          <Label htmlFor="audit-date-from">Từ ngày</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="audit-date-from"
              type="date"
              className="pl-9"
              value={filters.dateFrom}
              onChange={(event) =>
                update({ dateFrom: event.target.value, page: 1 })
              }
            />
          </div>
        </div>
        <div>
          <Label htmlFor="audit-date-to">Đến ngày</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="audit-date-to"
              type="date"
              className="pl-9"
              value={filters.dateTo}
              onChange={(event) =>
                update({ dateTo: event.target.value, page: 1 })
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
