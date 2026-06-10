export {
  ADMIN_GARAGE_DN_ID,
  ADMIN_GARAGE_Q7_ID,
  MOCK_GARAGE_ID,
  getAdminGarageById,
  getAdminGarageName,
  mockAdminGarageDaNang,
  mockAdminGarageQ7,
  mockAdminGarages,
} from './garages'

export { getAdminWashBaysByGarage, mockAdminWashBays } from './washBays'

export { mockAdminExtendedUsers } from './extendedUsers'

export {
  getAdminCustomerById,
  mockAdminCustomerLoyalty,
  mockAdminCustomers,
} from './customers'

export {
  getAdminStaffByGarage,
  mockAdminStaffProfiles,
  mockAdminStaffRecords,
} from './staffProfiles'

export {
  getAdminServicePackageById,
  getAdminServicePackageName,
  mockAdminServicePackages,
} from './servicePackages'

export {
  getAdminBookingById,
  getAdminBookingsByGarage,
  mockAdminBookings,
} from './bookings'

export { mockAdminTierRules } from './tierRules'
export { mockAdminPromotions } from './promotions'
export { getAdminAuditLogsByEntity, mockAdminAuditLogs } from './auditLogs'

import type { MockUser } from '../../types/user'
import { mockUsers } from '../users'
import { mockAdminExtendedUsers } from './extendedUsers'

/** Gộp user gốc + user mở rộng Admin (tra cứu booking / audit). */
export function getAdminAllUsers(): MockUser[] {
  const existingIds = new Set(mockUsers.map((user) => user.id))
  return [
    ...mockUsers,
    ...mockAdminExtendedUsers.filter((user) => !existingIds.has(user.id)),
  ]
}

export function getAdminUserById(userId: string) {
  return getAdminAllUsers().find((user) => user.id === userId)
}

export function getAdminCustomerDisplayName(customerId: string | null) {
  if (!customerId) return '—'
  return getAdminUserById(customerId)?.full_name ?? customerId
}
