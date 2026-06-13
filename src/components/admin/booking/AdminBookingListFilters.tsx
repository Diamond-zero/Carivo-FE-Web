import { RotateCcw, Search } from 'lucide-react'
import { BOOKING_STATUS_LABELS } from '../../../constants/bookingStatus'
import { VEHICLE_TYPE_LABELS } from '../../../constants/washBayStatus'
import { getAdminGaragesFromStore } from '../../../mocks/admin/adminGarageStore'
import type { BookingStatus } from '../../../types/booking'
import type { VehicleType } from '../../../types/washBay'
import {
  DEFAULT_ADMIN_BOOKING_FILTERS,
  type AdminBookingFilters,
} from '../../../utils/adminBookingLookup'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Select } from '../../ui/Select'

interface AdminBookingListFiltersProps {
  filters: AdminBookingFilters
  onChange: (filters: AdminBookingFilters) => void
  onReset: () => void
}

export function AdminBookingListFilters({
  filters,
  onChange,
  onReset,
}: AdminBookingListFiltersProps) {
  const garages = getAdminGaragesFromStore()

  const update = (patch: Partial<AdminBookingFilters>) => {
    onChange({ ...filters, ...patch })
  }

  const hasActiveFilters =
    filters.garageId !== DEFAULT_ADMIN_BOOKING_FILTERS.garageId ||
    filters.status !== DEFAULT_ADMIN_BOOKING_FILTERS.status ||
    filters.vehicleType !== DEFAULT_ADMIN_BOOKING_FILTERS.vehicleType ||
    filters.dateFrom !== DEFAULT_ADMIN_BOOKING_FILTERS.dateFrom ||
    filters.dateTo !== DEFAULT_ADMIN_BOOKING_FILTERS.dateTo ||
    filters.query !== DEFAULT_ADMIN_BOOKING_FILTERS.query

  return (
    <div className="carivo-panel p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-700">
        <Search className="h-4 w-4" />
        Bộ lọc booking (toàn hệ thống)
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <Label htmlFor="admin-booking-garage">Garage</Label>
          <Select
            id="admin-booking-garage"
            value={filters.garageId}
            onChange={(event) => update({ garageId: event.target.value })}
          >
            <option value="ALL">Tất cả garage</option>
            {garages.map((garage) => (
              <option key={garage.id} value={garage.id}>
                {garage.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="admin-booking-status">Trạng thái</Label>
          <Select
            id="admin-booking-status"
            value={filters.status}
            onChange={(event) =>
              update({ status: event.target.value as BookingStatus | 'ALL' })
            }
          >
            <option value="ALL">Tất cả trạng thái</option>
            {(Object.entries(BOOKING_STATUS_LABELS) as Array<[BookingStatus, string]>).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </Select>
        </div>

        <div>
          <Label htmlFor="admin-booking-vehicle">Loại xe</Label>
          <Select
            id="admin-booking-vehicle"
            value={filters.vehicleType}
            onChange={(event) =>
              update({ vehicleType: event.target.value as VehicleType | 'ALL' })
            }
          >
            <option value="ALL">Tất cả loại xe</option>
            <option value="CAR">{VEHICLE_TYPE_LABELS.CAR}</option>
            <option value="MOTORBIKE">{VEHICLE_TYPE_LABELS.MOTORBIKE}</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="admin-booking-from">Từ ngày</Label>
          <Input
            id="admin-booking-from"
            type="date"
            value={filters.dateFrom}
            onChange={(event) => update({ dateFrom: event.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="admin-booking-to">Đến ngày</Label>
          <Input
            id="admin-booking-to"
            type="date"
            value={filters.dateTo}
            onChange={(event) => update({ dateTo: event.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="admin-booking-query">Tìm kiếm</Label>
          <Input
            id="admin-booking-query"
            placeholder="Mã booking, biển số, SĐT..."
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
