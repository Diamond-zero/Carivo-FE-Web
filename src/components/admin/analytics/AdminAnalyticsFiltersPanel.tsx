import { Filter, RotateCcw } from 'lucide-react'
import { VEHICLE_TYPE_LABELS } from '../../../constants/washBayStatus'
import { useAdminGarages } from '../../../hooks/api/admin/useAdminGarages'
import { useAdminServicePackages } from '../../../hooks/api/admin/useAdminServicePackages'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Select } from '../../ui/Select'
import {
  ANALYTICS_GROUP_BY_OPTIONS,
  type AnalyticsFilterValues,
  DEFAULT_ANALYTICS_FILTERS,
  hasActiveAnalyticsFilters,
} from '../../../utils/adminAnalyticsFilters'

interface AdminAnalyticsFiltersPanelProps {
  filters: AnalyticsFilterValues
  onChange: (next: AnalyticsFilterValues) => void
  onReset: () => void
  /** Hide the service package picker when the page only deals with non-package data */
  showServicePackage?: boolean
  /** Show vehicle type filter */
  showVehicleType?: boolean
}

export function AdminAnalyticsFiltersPanel({
  filters,
  onChange,
  onReset,
  showServicePackage = true,
  showVehicleType = true,
}: AdminAnalyticsFiltersPanelProps) {
  const { allGarages } = useAdminGarages()
  const { allPackages } = useAdminServicePackages()

  const update = (patch: Partial<AnalyticsFilterValues>) => {
    onChange({ ...filters, ...patch })
  }

  const active = hasActiveAnalyticsFilters(filters)

  return (
    <div className="carivo-panel mb-6 p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-700">
        <Filter className="h-4 w-4" />
        Bộ lọc phân tích
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <Label htmlFor="analytics-from">Từ ngày</Label>
          <Input
            id="analytics-from"
            type="date"
            value={filters.from}
            onChange={(event) => update({ from: event.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="analytics-to">Đến ngày</Label>
          <Input
            id="analytics-to"
            type="date"
            value={filters.to}
            onChange={(event) => update({ to: event.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="analytics-group-by">Nhóm theo</Label>
          <Select
            id="analytics-group-by"
            value={filters.groupBy}
            onChange={(event) =>
              update({ groupBy: event.target.value as AnalyticsFilterValues['groupBy'] })
            }
          >
            {ANALYTICS_GROUP_BY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="analytics-garage">Chi nhánh</Label>
          <Select
            id="analytics-garage"
            value={filters.garageId}
            onChange={(event) => update({ garageId: event.target.value })}
          >
            <option value="ALL">Tất cả chi nhánh</option>
            {allGarages.map((garage) => (
              <option key={garage.id} value={garage.id}>
                {garage.name}
              </option>
            ))}
          </Select>
        </div>
        {showServicePackage ? (
          <div>
            <Label htmlFor="analytics-package">Gói dịch vụ</Label>
            <Select
              id="analytics-package"
              value={filters.servicePackageId}
              onChange={(event) => update({ servicePackageId: event.target.value })}
            >
              <option value="ALL">Tất cả gói</option>
              {allPackages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        {showVehicleType ? (
          <div>
            <Label htmlFor="analytics-vehicle">Loại xe</Label>
            <Select
              id="analytics-vehicle"
              value={filters.vehicleType}
              onChange={(event) =>
                update({
                  vehicleType: event.target.value as AnalyticsFilterValues['vehicleType'],
                })
              }
            >
              <option value="ALL">Tất cả loại xe</option>
              {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>

      {active ? (
        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
          >
            <RotateCcw className="h-4 w-4" />
            Xóa bộ lọc
          </Button>
        </div>
      ) : null}
    </div>
  )
}

// Re-export so the page-level hook can stay in sync when the reset clears initial values.
export { DEFAULT_ANALYTICS_FILTERS }
