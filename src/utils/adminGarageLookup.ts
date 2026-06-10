import { getAdminGaragesFromStore } from '../mocks/admin/adminGarageStore'
import { getAdminWashBaysByGarage } from '../mocks/admin/adminWashBayStore'
import type { Garage } from '../types/garage'
import { normalizeSearchText } from './booking'

export interface AdminGarageSummary extends Garage {
  washBayCount: number
  activeWashBayCount: number
}

export function getAdminGarageSummaries(): AdminGarageSummary[] {
  return getAdminGaragesFromStore()
    .map((garage) => {
      const washBays = getAdminWashBaysByGarage(garage.id)
      return {
        ...garage,
        washBayCount: washBays.length,
        activeWashBayCount: washBays.filter((bay) => bay.is_active).length,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}

export function searchAdminGarages(
  query: string,
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL',
): AdminGarageSummary[] {
  const normalizedQuery = normalizeSearchText(query.trim())
  let garages = getAdminGarageSummaries()

  if (statusFilter === 'ACTIVE') {
    garages = garages.filter((garage) => garage.is_active)
  } else if (statusFilter === 'INACTIVE') {
    garages = garages.filter((garage) => !garage.is_active)
  }

  if (!normalizedQuery) return garages

  return garages.filter((garage) => {
    const name = normalizeSearchText(garage.name)
    const code = normalizeSearchText(garage.garage_code)
    const city = normalizeSearchText(garage.city)
    const address = normalizeSearchText(garage.address)
    const phone = normalizeSearchText(garage.phone)

    return (
      name.includes(normalizedQuery) ||
      code.includes(normalizedQuery) ||
      city.includes(normalizedQuery) ||
      address.includes(normalizedQuery) ||
      phone.includes(normalizedQuery)
    )
  })
}
