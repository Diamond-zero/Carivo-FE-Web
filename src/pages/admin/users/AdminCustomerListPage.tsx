import { Lock, UserCheck, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AdminCustomerListTable } from '../../../components/admin/customer/AdminCustomerListTable'
import { CustomerSearchPanel } from '../../../components/customer/CustomerSearchPanel'
import { PageHeader } from '../../../components/layout/PageHeader'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { Label } from '../../../components/ui/Label'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { LOYALTY_TIER_LABELS } from '../../../constants/loyaltyTier'
import { useInitialPageSkeleton } from '../../../hooks/useInitialPageSkeleton'
import type { LoyaltyTier } from '../../../types/loyalty'
import { searchAdminCustomers } from '../../../utils/adminCustomerLookup'

const tierOptions: Array<{ value: LoyaltyTier | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Tất cả hạng' },
  ...(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as LoyaltyTier[]).map((tier) => ({
    value: tier,
    label: LOYALTY_TIER_LABELS[tier],
  })),
]

export function AdminCustomerListPage() {
  const [query, setQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<LoyaltyTier | 'ALL'>('ALL')
  const isLoading = useInitialPageSkeleton(280)

  const customers = useMemo(
    () => searchAdminCustomers(query, tierFilter),
    [query, tierFilter],
  )

  const allCustomers = useMemo(() => searchAdminCustomers('', 'ALL'), [])
  const activeCount = allCustomers.filter((item) => item.is_active).length
  const lockedCount = allCustomers.length - activeCount
  const hasActiveFilter = query.trim().length > 0 || tierFilter !== 'ALL'

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Admin"
            title="Khách hàng"
            description="Quản lý khách hàng toàn hệ thống — xem hồ sơ, loyalty và khóa/mở khóa tài khoản."
          />

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Tổng khách hàng"
              value={allCustomers.length}
              icon={Users}
              accent="brand"
            />
            <StatCard
              label="Đang hoạt động"
              value={activeCount}
              icon={UserCheck}
              accent="emerald"
            />
            <StatCard
              label="Đã khóa"
              value={lockedCount}
              icon={Lock}
              accent="violet"
            />
          </div>

          <div className="mb-6 space-y-4">
            <CustomerSearchPanel
              query={query}
              onChange={setQuery}
              onReset={() => setQuery('')}
            />
            <div className="carivo-panel max-w-xs p-4">
              <Label htmlFor="tier-filter" className="mb-1.5">
                Lọc theo hạng loyalty
              </Label>
              <Select
                id="tier-filter"
                value={tierFilter}
                onChange={(event) =>
                  setTierFilter(event.target.value as LoyaltyTier | 'ALL')
                }
              >
                {tierOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>
                {customers.length} khách hàng
                {hasActiveFilter ? ' (đã lọc)' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <AdminCustomerListTable
                customers={customers}
                hasActiveFilter={hasActiveFilter}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
