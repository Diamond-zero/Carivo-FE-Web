import { Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CustomerListTable } from '../../components/customer/CustomerListTable'
import { CustomerSearchPanel } from '../../components/customer/CustomerSearchPanel'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { StatCard } from '../../components/ui/StatCard'
import { useAuth } from '../../contexts/AuthContext'
import { useBookings } from '../../contexts/BookingContext'
import { useInitialPageSkeleton } from '../../hooks/useInitialPageSkeleton'
import { searchCustomersForGarage } from '../../utils/customerLookup'

export function CustomerListPage() {
  const { session } = useAuth()
  const { bookings } = useBookings()
  const [query, setQuery] = useState('')
  const isLoading = useInitialPageSkeleton(280)

  const garageId = session?.staffProfile.garage_id ?? ''

  const customers = useMemo(
    () => searchCustomersForGarage(query, bookings, garageId),
    [query, bookings, garageId],
  )

  const hasActiveSearch = query.trim().length > 0

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            title="Thông tin khách hàng"
            description="Tra cứu read-only thông tin khách đã từng đặt lịch tại garage của bạn."
          />

          <div className="mb-6 max-w-sm">
            <StatCard
              label="Khách tại garage"
              value={
                <>
                  {customers.length}
                  {hasActiveSearch ? ' (đã lọc)' : ''}
                </>
              }
              icon={Users}
              accent="brand"
            />
          </div>

          <div className="mb-6">
            <CustomerSearchPanel
              query={query}
              onChange={setQuery}
              onReset={() => setQuery('')}
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>
                {customers.length} khách hàng
                {hasActiveSearch ? ' (đã lọc)' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <CustomerListTable
                customers={customers}
                hasActiveSearch={hasActiveSearch}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
