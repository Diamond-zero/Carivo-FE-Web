import { RotateCcw, Search } from 'lucide-react'
import { AUDIT_ACTIONS, AUDIT_ACTION_LABELS, AUDIT_ENTITIES } from '../../../constants/auditLog'
import {
  DEFAULT_ADMIN_AUDIT_LOG_FILTERS,
  type AdminAuditLogFilters,
} from '../../../utils/adminAuditLogLookup'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Select } from '../../ui/Select'

interface AdminAuditLogFiltersProps {
  filters: AdminAuditLogFilters
  onChange: (filters: AdminAuditLogFilters) => void
  onReset: () => void
}

export function AdminAuditLogFiltersPanel({
  filters,
  onChange,
  onReset,
}: AdminAuditLogFiltersProps) {
  const update = (patch: Partial<AdminAuditLogFilters>) => {
    onChange({ ...filters, ...patch })
  }

  const hasActiveFilters =
    filters.entity !== DEFAULT_ADMIN_AUDIT_LOG_FILTERS.entity ||
    filters.action !== DEFAULT_ADMIN_AUDIT_LOG_FILTERS.action ||
    filters.actorRole !== DEFAULT_ADMIN_AUDIT_LOG_FILTERS.actorRole ||
    filters.query !== DEFAULT_ADMIN_AUDIT_LOG_FILTERS.query

  return (
    <div className="carivo-panel p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-700">
        <Search className="h-4 w-4" />
        Bộ lọc nhật ký
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <Label htmlFor="audit-entity">Đối tượng</Label>
          <Select
            id="audit-entity"
            value={filters.entity}
            onChange={(event) => update({ entity: event.target.value })}
          >
            <option value="ALL">Tất cả đối tượng</option>
            {AUDIT_ENTITIES.map((entity) => (
              <option key={entity} value={entity}>
                {entity}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="audit-action">Hành động</Label>
          <Select
            id="audit-action"
            value={filters.action}
            onChange={(event) => update({ action: event.target.value })}
          >
            <option value="ALL">Tất cả hành động</option>
            {AUDIT_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {AUDIT_ACTION_LABELS[action]}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="audit-role">Vai trò</Label>
          <Select
            id="audit-role"
            value={filters.actorRole}
            onChange={(event) => update({ actorRole: event.target.value })}
          >
            <option value="ALL">Tất cả</option>
            <option value="ADMIN">ADMIN</option>
            <option value="STAFF">STAFF</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="audit-query">Tìm kiếm</Label>
          <Input
            id="audit-query"
            placeholder="ID nhật ký, đối tượng, người thực hiện..."
            value={filters.query}
            onChange={(event) => update({ query: event.target.value })}
          />
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            Xóa bộ lọc
          </Button>
        </div>
      ) : null}
    </div>
  )
}
