import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookingListFilters } from '../../components/booking/BookingListFilters'
import { BookingTable } from '../../components/booking/BookingTable'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { useBookings } from '../../contexts/BookingContext'
import {
  DEFAULT_BOOKING_FILTERS,
  filterBookings,
  type BookingFilters,
} from '../../utils/bookingFilters'

export function BookingListPage() {
  const { bookings } = useBookings()
  const [filters, setFilters] = useState<BookingFilters>(DEFAULT_BOOKING_FILTERS)

  const filteredBookings = useMemo(
    () => filterBookings(bookings, filters),
    [bookings, filters],
  )

  return (
    <div>
      <PageHeader
        title="Danh sách booking"
        description="Xem và lọc booking theo trạng thái, ngày, biển số, số điện thoại."
        action={
          <Link to="/bookings/walk-in">
            <Button>
              <Plus className="h-4 w-4" />
              Walk-in mới
            </Button>
          </Link>
        }
      />

      <div className="mb-6">
        <BookingListFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_BOOKING_FILTERS)}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>
            {filteredBookings.length} booking
            {filters.status !== 'ALL' ||
            filters.date ||
            filters.licensePlate ||
            filters.phone
              ? ' (đã lọc)'
              : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <BookingTable bookings={filteredBookings} />
        </CardContent>
      </Card>
    </div>
  )
}
