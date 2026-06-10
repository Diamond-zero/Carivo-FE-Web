import type { AdminStaffRecord } from '../types/admin'
import { getAdminStaffRecordsFromStore } from '../mocks/admin/adminStaffStore'
import type { StaffType } from '../types/staffProfile'
import { normalizeSearchText } from './booking'

export function getAdminStaffSummaries(): AdminStaffRecord[] {
  return getAdminStaffRecordsFromStore().sort((a, b) =>
    a.user.full_name.localeCompare(b.user.full_name, 'vi'),
  )
}

export function searchAdminStaff(
  query: string,
  garageFilter: string | 'ALL' = 'ALL',
  staffTypeFilter: StaffType | 'ALL' = 'ALL',
): AdminStaffRecord[] {
  const normalizedQuery = normalizeSearchText(query.trim())
  let records = getAdminStaffSummaries()

  if (garageFilter !== 'ALL') {
    records = records.filter((record) => record.profile.garage_id === garageFilter)
  }

  if (staffTypeFilter !== 'ALL') {
    records = records.filter((record) => record.profile.staff_type === staffTypeFilter)
  }

  if (!normalizedQuery) return records

  return records.filter((record) => {
    const name = normalizeSearchText(record.user.full_name)
    const phone = normalizeSearchText(record.user.phone)
    const code = normalizeSearchText(record.profile.staff_code)
    const garage = normalizeSearchText(record.garage.name)

    return (
      name.includes(normalizedQuery) ||
      phone.includes(normalizedQuery) ||
      code.includes(normalizedQuery) ||
      garage.includes(normalizedQuery)
    )
  })
}
