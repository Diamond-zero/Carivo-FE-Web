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

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 py-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Khách tại garage</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {customers.length}
                    {hasActiveSearch ? ' (đã lọc)' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
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
