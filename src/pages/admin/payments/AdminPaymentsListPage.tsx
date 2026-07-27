import { Download, Loader2, RefreshCw, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../../api/client'
import { AdminPaymentListFilters } from '../../../components/admin/payment/AdminPaymentListFilters'
import { AdminPaymentListTable } from '../../../components/admin/payment/AdminPaymentListTable'
import { AdminPaymentSummary } from '../../../components/admin/payment/AdminPaymentSummary'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import {
  DEFAULT_ADMIN_PAYMENT_FILTERS,
  useAdminPaymentList,
  type AdminPaymentFilters,
} from '../../../hooks/api/admin/useAdminPayments'
import { exportBookingsToCsv } from './adminPaymentExport'

function hasActiveFilter(filters: AdminPaymentFilters) {
  return (
    (filters.status !== 'ALL' && Boolean(filters.status)) ||
    (filters.garageId !== 'ALL' && Boolean(filters.garageId)) ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    Boolean(filters.query?.trim())
  )
}

export function AdminPaymentsListPage() {
  const { showToast } = useToast()
  const [filters, setFilters] = useState<AdminPaymentFilters>(DEFAULT_ADMIN_PAYMENT_FILTERS)

  const listQuery = useAdminPaymentList(filters)
  const bookings = listQuery.data?.items ?? []

  const isLoading = listQuery.isLoading
  const isFiltering = hasActiveFilter(filters)

  useEffect(() => {
    if (listQuery.isError) {
      showToast(
        getApiErrorMessage(listQuery.error, 'Không tải được danh sách payment.'),
        'error',
      )
    }
  }, [listQuery.isError, listQuery.error, showToast])

  const handleReset = () => {
    setFilters(DEFAULT_ADMIN_PAYMENT_FILTERS)
  }

  const handleExport = () => {
    if (bookings.length === 0) {
                showToast('Không có giao dịch để xuất.', 'error')
      return
    }
    exportBookingsToCsv(bookings)
    showToast(`Đã xuất ${bookings.length} giao dịch ra CSV.`, 'success')
  }

  const totalLabel = useMemo(() => {
    const total = bookings.length
    return total > 0 ? `${total} giao dịch` : 'Chưa có giao dịch'
  }, [bookings.length])

  if (isLoading) {
    return (
      <div>
        <PageHeader
          eyebrow="Carivo Quản trị"
          title="Thanh toán"
          description="Theo dõi mọi giao dịch PayOS trên toàn hệ thống."
        />
        <DashboardPageSkeleton />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Thanh toán"
        description="Theo dõi mọi giao dịch PayOS trên toàn hệ thống — lọc theo chi nhánh, trạng thái, ngày tạo."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void listQuery.refetch()}
              disabled={listQuery.isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${listQuery.isFetching ? 'animate-spin' : ''}`}
              />
              Làm mới
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Xuất CSV
            </Button>
          </div>
        }
      />

      <div className="mt-4 space-y-4">
        <AdminPaymentSummary bookings={bookings} />

        <AdminPaymentListFilters
          filters={filters}
          onChange={setFilters}
          onReset={handleReset}
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-500" />
                Danh sách giao dịch
              </CardTitle>
              <span className="text-xs text-slate-500">{totalLabel}</span>
            </div>
          </CardHeader>
          <CardContent>
            {listQuery.isFetching && !isLoading ? (
              <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang cập nhật…
              </div>
            ) : null}
            <AdminPaymentListTable
              bookings={bookings}
              hasActiveFilter={isFiltering}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
