import type { VehicleType } from '../types/washBay'

export interface MockServicePackage {
  id: string
  name: string
  vehicle_type: VehicleType
  base_price: number
  duration_minutes: number
}

export const mockServicePackageList: MockServicePackage[] = [
  {
    id: 'pkg-wash-car-basic',
    name: 'Rửa xe ô tô cơ bản',
    vehicle_type: 'CAR',
    base_price: 150000,
    duration_minutes: 45,
  },
  {
    id: 'pkg-wash-car-premium',
    name: 'Rửa xe ô tô cao cấp',
    vehicle_type: 'CAR',
    base_price: 280000,
    duration_minutes: 60,
  },
  {
    id: 'pkg-wash-bike-basic',
    name: 'Rửa xe máy cơ bản',
    vehicle_type: 'MOTORBIKE',
    base_price: 50000,
    duration_minutes: 20,
  },
  {
    id: 'pkg-wash-bike-premium',
    name: 'Rửa xe máy cao cấp',
    vehicle_type: 'MOTORBIKE',
    base_price: 80000,
    duration_minutes: 30,
  },
]

export const mockServicePackages = Object.fromEntries(
  mockServicePackageList.map((pkg) => [pkg.id, pkg.name]),
) as Record<string, string>

export function getServicePackageName(id: string) {
  return (
    mockServicePackageList.find((pkg) => pkg.id === id)?.name ?? id
  )
}

export function getServicePackagesByVehicleType(vehicleType: VehicleType) {
  return mockServicePackageList.filter(
    (pkg) => pkg.vehicle_type === vehicleType,
  )
}

export function getServicePackageById(id: string) {
  return mockServicePackageList.find((pkg) => pkg.id === id)
}
