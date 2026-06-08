import { RotateCcw, Search } from 'lucide-react'
import {
  DEFAULT_WASH_HISTORY_FILTERS,
  type WashHistoryFilters,
} from '../../utils/washHistoryFilters'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'

interface WashHistoryFiltersProps {
  filters: WashHistoryFilters
  onChange: (filters: WashHistoryFilters) => void
  onReset: () => void
}

export function WashHistoryFiltersPanel({
  filters,
  onChange,
  onReset,
}: WashHistoryFiltersProps) {
  const update = (patch: Partial<WashHistoryFilters>) => {
    onChange({ ...filters, ...patch })
  }

  const hasActiveFilters =
    filters.date !== DEFAULT_WASH_HISTORY_FILTERS.date ||
    filters.licensePlate !== DEFAULT_WASH_HISTORY_FILTERS.licensePlate ||
    filters.query !== DEFAULT_WASH_HISTORY_FILTERS.query

  return (
    <div className="carivo-panel p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-700">
        <Search className="h-4 w-4" />
        Bộ lọc lịch sử
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <Label htmlFor="wash-history-date">Ngày rửa</Label>
          <Input
            id="wash-history-date"
            type="date"
            value={filters.date}
            onChange={(event) => update({ date: event.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="wash-history-plate">Biển số</Label>
          <Input
            id="wash-history-plate"
            placeholder="VD: 30A-555.44"
            value={filters.licensePlate}
            onChange={(event) => update({ licensePlate: event.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="wash-history-query">Tìm kiếm</Label>
          <Input
            id="wash-history-query"
            placeholder="Khách, mã booking..."
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
