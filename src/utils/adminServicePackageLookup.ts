import type { ServiceType } from '../types/servicePackage'
import type { VehicleType } from '../types/washBay'
import { getAdminServicePackagesFromStore } from '../mocks/admin/adminServicePackageStore'
import { normalizeSearchText } from './booking'

export function getAdminServicePackageSummaries() {
  return getAdminServicePackagesFromStore().sort((a, b) =>
    a.name.localeCompare(b.name, 'vi'),
  )
}

export function searchAdminServicePackages(
  query: string,
  vehicleTypeFilter: VehicleType | 'ALL' = 'ALL',
  serviceTypeFilter: ServiceType | 'ALL' = 'ALL',
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL',
) {
  const normalizedQuery = normalizeSearchText(query.trim())
  let items = getAdminServicePackageSummaries()

  if (vehicleTypeFilter !== 'ALL') {
    items = items.filter((pkg) => pkg.vehicle_type === vehicleTypeFilter)
  }

  if (serviceTypeFilter !== 'ALL') {
    items = items.filter((pkg) => pkg.service_type === serviceTypeFilter)
  }

  if (statusFilter === 'ACTIVE') {
    items = items.filter((pkg) => pkg.is_active)
  } else if (statusFilter === 'INACTIVE') {
    items = items.filter((pkg) => !pkg.is_active)
  }

  if (!normalizedQuery) return items

  return items.filter((pkg) => {
    const name = normalizeSearchText(pkg.name)
    const description = normalizeSearchText(pkg.description)
    const id = normalizeSearchText(pkg.id)

    return (
      name.includes(normalizedQuery) ||
      description.includes(normalizedQuery) ||
      id.includes(normalizedQuery)
    )
  })
}
