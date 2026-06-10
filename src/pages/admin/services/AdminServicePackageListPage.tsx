import { Package, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminServicePackageListTable } from '../../../components/admin/servicePackage/AdminServicePackageListTable'
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
import { SERVICE_TYPE_LABELS, SERVICE_TYPES } from '../../../constants/servicePackage'
import { VEHICLE_TYPE_LABELS } from '../../../constants/washBayStatus'
import { useToast } from '../../../contexts/ToastContext'
import { useInitialPageSkeleton } from '../../../hooks/useInitialPageSkeleton'
import { toggleAdminServicePackageActive } from '../../../mocks/admin/adminServicePackageStore'
import type { ServiceType } from '../../../types/servicePackage'
import type { VehicleType } from '../../../types/washBay'
import { searchAdminServicePackages } from '../../../utils/adminServicePackageLookup'

export function AdminServicePackageListPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<VehicleType | 'ALL'>('ALL')
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [refreshKey, setRefreshKey] = useState(0)
  const [confirmPackageId, setConfirmPackageId] = useState<string | null>(null)
  const isLoading = useInitialPageSkeleton(280)

  const packages = useMemo(
    () =>
      searchAdminServicePackages(
        query,
        vehicleTypeFilter,
        serviceTypeFilter,
        statusFilter,
      ),
    [query, vehicleTypeFilter, serviceTypeFilter, statusFilter, refreshKey],
  )

  const allPackages = useMemo(
    () => searchAdminServicePackages('', 'ALL', 'ALL', 'ALL'),
    [refreshKey],
  )
  const activeCount = allPackages.filter((pkg) => pkg.is_active).length
  const washCount = allPackages.filter((pkg) => pkg.service_type === 'WASH').length
  const comboCount = allPackages.filter((pkg) => pkg.service_type === 'COMBO').length
  const hasActiveFilter =
    query.trim().length > 0 ||
    vehicleTypeFilter !== 'ALL' ||
    serviceTypeFilter !== 'ALL' ||
    statusFilter !== 'ALL'

  const pendingPackage = confirmPackageId
    ? allPackages.find((pkg) => pkg.id === confirmPackageId)
    : undefined

  const handleConfirmToggle = () => {
    if (!confirmPackageId) return

    const result = toggleAdminServicePackageActive(confirmPackageId)
    setConfirmPackageId(null)

    if (!result.ok) {
      showToast(result.message, 'error')
      return
    }

    setRefreshKey((value) => value + 1)
    showToast(
      result.package.is_active
        ? `Đã kích hoạt ${result.package.name}.`
        : `Đã ngưng bán ${result.package.name}.`,
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
            title="Service Packages"
            description="Quản lý gói dịch vụ toàn hệ thống — giá, thời lượng, điểm và cấu hình vận hành."
            action={
              <Link to="/admin/services/packages/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  Thêm gói dịch vụ
                </Button>
              </Link>
            }
          />

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Tổng gói dịch vụ"
              value={allPackages.length}
              icon={Package}
              accent="brand"
            />
            <StatCard
              label="Đang bán"
              value={activeCount}
              icon={Package}
              accent="emerald"
            />
            <StatCard
              label="Rửa xe / Combo"
              value={`${washCount} / ${comboCount}`}
              icon={Package}
              accent="amber"
            />
          </div>

          <div className="mb-6 space-y-4">
            <CustomerSearchPanel
              query={query}
              onChange={setQuery}
              onReset={() => setQuery('')}
            />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="carivo-panel p-4">
                <Label htmlFor="pkg-vehicle-filter" className="mb-1.5">
                  Loại xe
                </Label>
                <Select
                  id="pkg-vehicle-filter"
                  value={vehicleTypeFilter}
                  onChange={(event) =>
                    setVehicleTypeFilter(event.target.value as VehicleType | 'ALL')
                  }
                >
                  <option value="ALL">Tất cả</option>
                  <option value="CAR">{VEHICLE_TYPE_LABELS.CAR}</option>
                  <option value="MOTORBIKE">{VEHICLE_TYPE_LABELS.MOTORBIKE}</option>
                </Select>
              </div>
              <div className="carivo-panel p-4">
                <Label htmlFor="pkg-service-filter" className="mb-1.5">
                  Loại dịch vụ
                </Label>
                <Select
                  id="pkg-service-filter"
                  value={serviceTypeFilter}
                  onChange={(event) =>
                    setServiceTypeFilter(event.target.value as ServiceType | 'ALL')
                  }
                >
                  <option value="ALL">Tất cả</option>
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {SERVICE_TYPE_LABELS[type]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="carivo-panel p-4">
                <Label htmlFor="pkg-status-filter" className="mb-1.5">
                  Trạng thái
                </Label>
                <Select
                  id="pkg-status-filter"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
                  }
                >
                  <option value="ALL">Tất cả</option>
                  <option value="ACTIVE">Đang bán</option>
                  <option value="INACTIVE">Ngưng bán</option>
                </Select>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {packages.length} gói dịch vụ
                {hasActiveFilter ? ' (đã lọc)' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <AdminServicePackageListTable
                packages={packages}
                hasActiveFilter={hasActiveFilter}
                onToggleActive={setConfirmPackageId}
              />
            </CardContent>
          </Card>

          <Modal
            open={Boolean(confirmPackageId && pendingPackage)}
            onClose={() => setConfirmPackageId(null)}
            title={pendingPackage?.is_active ? 'Ngưng bán gói dịch vụ?' : 'Kích hoạt lại gói?'}
            description={
              pendingPackage
                ? `${pendingPackage.name} — ${SERVICE_TYPE_LABELS[pendingPackage.service_type]}.`
                : undefined
            }
          >
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmPackageId(null)}>
                Hủy
              </Button>
              <Button
                variant={pendingPackage?.is_active ? 'danger' : 'primary'}
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
