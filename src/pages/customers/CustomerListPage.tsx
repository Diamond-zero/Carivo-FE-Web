import { Users } from 'lucide-react'
import { useState } from 'react'
import { CustomerListTable } from '../../components/customer/CustomerListTable'
import { CustomerSearchPanel } from '../../components/customer/CustomerSearchPanel'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { StatCard } from '../../components/ui/StatCard'
import { useInitialPageSkeleton } from '../../hooks/useInitialPageSkeleton'
import { useStaffCustomers } from '../../hooks/api/staff/useStaffCustomers'

export function CustomerListPage() {
  const [query, setQuery] = useState('')
  const isLoading = useInitialPageSkeleton(280)

  const { customers, isFromApi } = useStaffCustomers(query)

  const hasActiveSearch = query.trim().length > 0

  return (
    <div className="space-y-6">
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            title="Thông tin khách hàng"
            description="Tra cứu khách tại garage — ưu tiên GET /admin/customers, fallback từ booking."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Khách tại garage"
              value={customers.length}
              icon={Users}
              accent="brand"
              hint={
                hasActiveSearch
                  ? 'Theo từ khóa đang nhập'
                  : 'Suy ra từ booking + API'
              }
            />
            <StatCard
              label="Nguồn dữ liệu"
              value={isFromApi ? 'API' : 'Booking'}
              icon={Users}
              accent={isFromApi ? 'emerald' : 'amber'}
              hint={
                isFromApi
                  ? 'Đang đồng bộ từ BE'
                  : 'Suy ra từ booking tại garage'
              }
            />
          </div>

          <CustomerSearchPanel
            query={query}
            onChange={setQuery}
            onReset={() => setQuery('')}
          />

          <Card className="border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">
                  {customers.length}
                </span>{' '}
                khách hàng
                {hasActiveSearch ? ' (đã lọc)' : ''}
              </p>
            </div>
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