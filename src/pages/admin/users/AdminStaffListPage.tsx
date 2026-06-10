import { Plus, UserCheck, UserCog, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminStaffListTable } from '../../../components/admin/staff/AdminStaffListTable'
import { CustomerSearchPanel } from '../../../components/customer/CustomerSearchPanel'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { Label } from '../../../components/ui/Label'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { STAFF_TYPE_LABELS, STAFF_TYPES } from '../../../constants/staffType'
import { useToast } from '../../../contexts/ToastContext'
import { useInitialPageSkeleton } from '../../../hooks/useInitialPageSkeleton'
import { getAdminGaragesFromStore } from '../../../mocks/admin'
import { toggleAdminStaffProfileActive } from '../../../mocks/admin/adminStaffStore'
import type { StaffType } from '../../../types/staffProfile'
import { searchAdminStaff } from '../../../utils/adminStaffLookup'

export function AdminStaffListPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [garageFilter, setGarageFilter] = useState<string | 'ALL'>('ALL')
  const [staffTypeFilter, setStaffTypeFilter] = useState<StaffType | 'ALL'>('ALL')
  const [refreshKey, setRefreshKey] = useState(0)
  const [confirmProfileId, setConfirmProfileId] = useState<string | null>(null)
  const isLoading = useInitialPageSkeleton(280)

  const staff = useMemo(
    () => searchAdminStaff(query, garageFilter, staffTypeFilter),
    [query, garageFilter, staffTypeFilter, refreshKey],
  )

  const allStaff = useMemo(() => searchAdminStaff('', 'ALL', 'ALL'), [refreshKey])
  const activeCount = allStaff.filter(
    (record) => record.profile.is_active && record.user.is_active,
  ).length
  const garages = useMemo(() => getAdminGaragesFromStore(), [refreshKey])
  const hasActiveFilter =
    query.trim().length > 0 || garageFilter !== 'ALL' || staffTypeFilter !== 'ALL'

  const pendingRecord = confirmProfileId
    ? allStaff.find((record) => record.profile.id === confirmProfileId)
    : undefined

  const handleToggleRequest = (profileId: string) => {
    setConfirmProfileId(profileId)
  }

  const handleConfirmToggle = () => {
    if (!confirmProfileId) return

    const result = toggleAdminStaffProfileActive(confirmProfileId)
    setConfirmProfileId(null)

    if (!result.ok) {
      showToast(result.message, 'error')
      return
    }

    setRefreshKey((value) => value + 1)
    showToast(
      result.record.profile.is_active
        ? `Đã kích hoạt nhân viên ${result.record.user.full_name}.`
        : `Đã ngưng làm việc ${result.record.user.full_name}.`,
      'success',
    )
  }

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Admin"
            title="Nhân viên"
            description="Quản lý hồ sơ nhân viên tại mọi garage — lọc theo chi nhánh và vai trò."
            action={
              <Link to="/admin/users/staff/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  Thêm nhân viên
                </Button>
              </Link>
            }
          />

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Tổng nhân viên"
              value={allStaff.length}
              icon={Users}
              accent="brand"
            />
            <StatCard
              label="Đang làm việc"
              value={activeCount}
              icon={UserCheck}
              accent="emerald"
            />
            <StatCard
              label="Ngưng làm việc"
              value={allStaff.length - activeCount}
              icon={UserCog}
              accent="violet"
            />
          </div>

          <div className="mb-6 space-y-4">
            <CustomerSearchPanel
              query={query}
              onChange={setQuery}
              onReset={() => setQuery('')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="carivo-panel p-4">
                <Label htmlFor="garage-filter" className="mb-1.5">
                  Lọc theo garage
                </Label>
                <Select
                  id="garage-filter"
                  value={garageFilter}
                  onChange={(event) => setGarageFilter(event.target.value)}
                >
                  <option value="ALL">Tất cả garage</option>
                  {garages.map((garage) => (
                    <option key={garage.id} value={garage.id}>
                      {garage.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="carivo-panel p-4">
                <Label htmlFor="staff-type-filter" className="mb-1.5">
                  Lọc theo vai trò
                </Label>
                <Select
                  id="staff-type-filter"
                  value={staffTypeFilter}
                  onChange={(event) =>
                    setStaffTypeFilter(event.target.value as StaffType | 'ALL')
                  }
                >
                  <option value="ALL">Tất cả vai trò</option>
                  {STAFF_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {STAFF_TYPE_LABELS[type]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {staff.length} nhân viên
                {hasActiveFilter ? ' (đã lọc)' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <AdminStaffListTable
                staff={staff}
                hasActiveFilter={hasActiveFilter}
                onToggleActive={handleToggleRequest}
              />
            </CardContent>
          </Card>

          <Modal
            open={Boolean(confirmProfileId && pendingRecord)}
            onClose={() => setConfirmProfileId(null)}
            title={
              pendingRecord?.profile.is_active
                ? 'Ngưng làm việc nhân viên?'
                : 'Kích hoạt lại nhân viên?'
            }
            description={
              pendingRecord
                ? `${pendingRecord.user.full_name} (${pendingRecord.profile.staff_code}) tại ${pendingRecord.garage.name}.`
                : undefined
            }
          >
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmProfileId(null)}>
                Hủy
              </Button>
              <Button
                variant={pendingRecord?.profile.is_active ? 'danger' : 'primary'}
                onClick={handleConfirmToggle}
              >
                Xác nhận
              </Button>
            </div>
          </Modal>
        </>
      )}
    </div>
  )
}
