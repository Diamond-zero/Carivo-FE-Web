import type { AdminStaffRecord } from '../../types/admin'
import type { StaffProfile } from '../../types/staffProfile'
import { mockStaffProfiles } from '../staffProfile'
import { mockStaffUsers } from '../users'
import { getAdminGarageById } from './adminGarageStore'
import { ADMIN_GARAGE_DN_ID, ADMIN_GARAGE_Q7_ID } from './garages'
import { mockAdminExtendedUsers } from './extendedUsers'

const extendedStaffProfiles: StaffProfile[] = [
  {
    id: 'staff-profile-005',
    user_id: 'user-stf-005',
    staff_code: 'STF005',
    staff_type: 'CUSTOMER_SERVICE_STAFF',
    garage_id: ADMIN_GARAGE_Q7_ID,
    is_active: true,
  },
  {
    id: 'staff-profile-006',
    user_id: 'user-stf-006',
    staff_code: 'STF006',
    staff_type: 'WASH_OPERATOR',
    garage_id: ADMIN_GARAGE_Q7_ID,
    is_active: true,
  },
  {
    id: 'staff-profile-007',
    user_id: 'user-stf-007',
    staff_code: 'STF007',
    staff_type: 'VEHICLE_INSPECTION_STAFF',
    garage_id: ADMIN_GARAGE_DN_ID,
    is_active: true,
  },
  {
    id: 'staff-profile-008',
    user_id: 'user-stf-008',
    staff_code: 'STF008',
    staff_type: 'VEHICLE_CARE_STAFF',
    garage_id: ADMIN_GARAGE_DN_ID,
    is_active: false,
  },
]

export const mockAdminStaffProfiles: StaffProfile[] = [
  ...mockStaffProfiles,
  ...extendedStaffProfiles,
]

function toUserRecord(user: (typeof mockStaffUsers)[number]) {
  const { password: _password, ...rest } = user
  return rest
}

/** 8 nhân viên trên 3 garage. */
export const mockAdminStaffRecords: AdminStaffRecord[] = [
  ...mockStaffUsers.map((user) => {
    const profile = mockStaffProfiles.find((item) => item.user_id === user.id)!
    return {
      user: toUserRecord(user),
      profile,
      garage: getAdminGarageById(profile.garage_id)!,
    }
  }),
  ...mockAdminExtendedUsers
    .filter((user) => user.role === 'STAFF')
    .map((user) => {
      const profile = extendedStaffProfiles.find((item) => item.user_id === user.id)!
      return {
        user: toUserRecord(user),
        profile,
        garage: getAdminGarageById(profile.garage_id)!,
      }
    }),
]

export function getAdminStaffByGarage(garageId: string) {
  return mockAdminStaffRecords.filter((record) => record.profile.garage_id === garageId)
}
