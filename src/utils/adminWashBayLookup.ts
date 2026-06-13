import { getAdminGarageName } from '../mocks/admin/adminGarageStore'
import { getAdminWashBaysFromStore } from '../mocks/admin/adminWashBayStore'
import type { VehicleType, WashBay, WashBayStatus } from '../types/washBay'
import { normalizeSearchText } from './booking'

export interface AdminWashBaySummary extends WashBay {
  garage_name: string
}

export function getAdminWashBaySummaries(): AdminWashBaySummary[] {
  return getAdminWashBaysFromStore()
    .map((bay) => ({
      ...bay,
      garage_name: getAdminGarageName(bay.garage_id),
    }))
    .sort((a, b) => a.garage_name.localeCompare(b.garage_name, 'vi'))
}

export function searchAdminWashBays(
  query: string,
  garageFilter: string | 'ALL' = 'ALL',
  vehicleTypeFilter: VehicleType | 'ALL' = 'ALL',
  statusFilter: WashBayStatus | 'ALL' = 'ALL',
): AdminWashBaySummary[] {
  const normalizedQuery = normalizeSearchText(query.trim())
  let bays = getAdminWashBaySummaries()

  if (garageFilter !== 'ALL') {
    bays = bays.filter((bay) => bay.garage_id === garageFilter)
  }

  if (vehicleTypeFilter !== 'ALL') {
    bays = bays.filter((bay) => bay.vehicle_type === vehicleTypeFilter)
  }

  if (statusFilter !== 'ALL') {
    bays = bays.filter((bay) => bay.status === statusFilter)
  }

  if (!normalizedQuery) return bays

  return bays.filter((bay) => {
    const name = normalizeSearchText(bay.name)
    const code = normalizeSearchText(bay.bay_code)
    const garage = normalizeSearchText(bay.garage_name)

    return (
      name.includes(normalizedQuery) ||
      code.includes(normalizedQuery) ||
      garage.includes(normalizedQuery)
    )
  })
}
