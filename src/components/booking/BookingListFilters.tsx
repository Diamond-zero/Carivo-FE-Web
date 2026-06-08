import { RotateCcw, Search } from 'lucide-react'
import type { BookingStatus } from '../../types/booking'
import { BOOKING_STATUS_LABELS } from '../../constants/bookingStatus'
import {
  DEFAULT_BOOKING_FILTERS,
  type BookingFilters,
} from '../../utils/bookingFilters'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Select } from '../ui/Select'

interface BookingListFiltersProps {
  filters: BookingFilters
  onChange: (filters: BookingFilters) => void
  onReset: () => void
}

const STATUS_OPTIONS: Array<{ value: BookingFilters['status']; label: string }> =
  [
    { value: 'ALL', label: 'Tất cả trạng thái' },
    ...(Object.entries(BOOKING_STATUS_LABELS) as Array<
      [BookingStatus, string]
    >).map(([value, label]) => ({ value, label })),
  ]

export function BookingListFilters({
  filters,
  onChange,
  onReset,
}: BookingListFiltersProps) {
  const update = (patch: Partial<BookingFilters>) => {
    onChange({ ...filters, ...patch })
  }

  const hasActiveFilters =
    filters.status !== DEFAULT_BOOKING_FILTERS.status ||
    filters.date !== DEFAULT_BOOKING_FILTERS.date ||
    filters.licensePlate !== DEFAULT_BOOKING_FILTERS.licensePlate ||
    filters.phone !== DEFAULT_BOOKING_FILTERS.phone

  return (
    <div className="carivo-panel p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-700">
        <Search className="h-4 w-4" />
        Bộ lọc booking
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <Label htmlFor="filter-status">Trạng thái</Label>
          <Select
            id="filter-status"
            value={filters.status}
            onChange={(event) =>
              update({
                status: event.target.value as BookingFilters['status'],
              })
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="filter-date">Ngày</Label>
          <Input
            id="filter-date"
            type="date"
            value={filters.date}
            onChange={(event) => update({ date: event.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="filter-plate">Biển số</Label>
          <Input
            id="filter-plate"
            type="text"
            placeholder="30A-123.45"
            value={filters.licensePlate}
            onChange={(event) =>
              update({ licensePlate: event.target.value })
            }
          />
        </div>

        <div>
          <Label htmlFor="filter-phone">Số điện thoại</Label>
          <Input
            id="filter-phone"
            type="tel"
            placeholder="0901234567"
            value={filters.phone}
            onChange={(event) => update({ phone: event.target.value })}
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
