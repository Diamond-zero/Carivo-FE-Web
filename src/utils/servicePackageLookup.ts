import type { ServicePackage } from '../types/servicePackage'
import type { VehicleType } from '../types/washBay'

export function getServicePackageName(
  packages: ServicePackage[],
  id: string,
  fallbackName?: string,
) {
  return (
    packages.find((pkg) => pkg.id === id)?.name ??
    fallbackName ??
    'Gói dịch vụ'
  )
}

export function getServicePackageById(packages: ServicePackage[], id: string) {
  return packages.find((pkg) => pkg.id === id)
}

export function getServicePackagesByVehicleType(
  packages: ServicePackage[],
  vehicleType: VehicleType,
) {
  return packages.filter(
    (pkg) => pkg.vehicle_type === vehicleType && pkg.is_active,
  )
}
