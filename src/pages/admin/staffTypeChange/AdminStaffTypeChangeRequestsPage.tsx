import { ClipboardList, RefreshCcw, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminStaffTypeChangeRequestListTable } from '../../../components/admin/staffTypeChange/AdminStaffTypeChangeRequestListTable'
import {
  AdminStaffTypeChangeRequestFiltersPanel,
} from '../../../components/admin/staffTypeChange/AdminStaffTypeChangeRequestFiltersPanel'
import {
  DEFAULT_ADMIN_STAFF_TYPE_CHANGE_REQUEST_FILTERS,
  filterAdminStaffTypeChangeRequests,
  hasActiveAdminStaffTypeChangeRequestFilters,
  type AdminStaffTypeChangeRequestFilters,
} from '../../../components/admin/staffTypeChange/AdminStaffTypeChangeRequestFilters.helpers'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminStaffTypeChangeRequests } from '../../../hooks/api/admin/useAdminStaffTypeChangeRequests'

export function AdminStaffTypeChangeRequestsPage() {
  const { showToast } = useToast()
  const [filters, setFilters] = useState<AdminStaffTypeChangeRequestFilters>(
    DEFAULT_ADMIN_STAFF_TYPE_CHANGE_REQUEST_FILTERS,
  )

  const query = useAdminStaffTypeChangeRequests({})
  const allRequests = useMemo(() => query.data?.data ?? [], [query.data?.data])

  useEffect(() => {
    if (query.isError) {
      showToast(
        getApiErrorMessage(
          query.error,
          'Không tải được danh sách yêu cầu đổi chức năng.',
        ),
        'error',
      )
    }
  }, [query.isError, query.error, showToast])

  const filteredRequests = useMemo(
    () => filterAdminStaffTypeChangeRequests(filters, allRequests),
    [filters, allRequests],
  )

  const pendingCount = allRequests.filter(
    (r: { status: string }) => r.status === 'REQUESTED',
  ).length
  const approvedCount = allRequests.filter(
    (r: { status: string }) =>
      r.status === 'APPROVED' || r.status === 'SCHEDULED',
  ).length
  const appliedCount = allRequests.filter(
    (r: { status: string }) => r.status === 'APPLIED',
  ).length
  const rejectedCount = allRequests.filter(
    (r: { status: string }) =>
      r.status === 'REJECTED' ||
      r.status === 'CANCELLED' ||
      r.status === 'FAILED',
  ).length

  const hasActiveFilter = hasActiveAdminStaffTypeChangeRequestFilters(filters)

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Yêu cầu đổi chức năng nhân viên"
        description="Duyệt các yêu cầu nhân viên gửi khi muốn chuyển sang vai trò khác. Mỗi yêu cầu kèm theo lý do và ảnh hưởng dự kiến tới workload."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCcw
              className={
                query.isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'
              }
            />
            Tải lại
          </Button>
        }
      />

      {query.isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-4">
            <StatCard
              label="Đang chờ duyệt"
              value={pendingCount}
              icon={ClipboardList}
              accent="amber"
            />
            <StatCard
              label="Đã duyệt / lên lịch"
              value={approvedCount}
              icon={ShieldCheck}
              accent="brand"
            />
            <StatCard
              label="Đã áp dụng"
              value={appliedCount}
              icon={ShieldCheck}
              accent="emerald"
            />
            <StatCard
              label="Từ chối / Hủy / Lỗi"
              value={rejectedCount}
              icon={ClipboardList}
              accent="violet"
            />
          </div>

          <div className="mb-6">
            <AdminStaffTypeChangeRequestFiltersPanel
              filters={filters}
              onChange={setFilters}
              onReset={() =>
                setFilters(DEFAULT_ADMIN_STAFF_TYPE_CHANGE_REQUEST_FILTERS)
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {filteredRequests.length} yêu cầu
                {hasActiveFilter ? ' (đã lọc)' : ''}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  · <Link to="/admin/users/staff" className="carivo-link">Quản lý nhân viên</Link>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <AdminStaffTypeChangeRequestListTable
                requests={filteredRequests}
                hasActiveFilter={hasActiveFilter}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
