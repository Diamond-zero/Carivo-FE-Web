import type { StaffProfile } from '../types/staffProfile'
import { MOCK_GARAGE_ID } from './garage'

export const mockStaffProfiles: StaffProfile[] = [
  {
    id: 'staff-profile-001',
    user_id: 'user-stf-001',
    staff_code: 'STF001',
    staff_type: 'CUSTOMER_SERVICE_STAFF',
    garage_id: MOCK_GARAGE_ID,
    is_active: true,
  },
  {
    id: 'staff-profile-002',
    user_id: 'user-stf-002',
    staff_code: 'STF002',
    staff_type: 'VEHICLE_INSPECTION_STAFF',
    garage_id: MOCK_GARAGE_ID,
    is_active: true,
  },
  {
    id: 'staff-profile-003',
    user_id: 'user-stf-003',
    staff_code: 'STF003',
    staff_type: 'WASH_OPERATOR',
    garage_id: MOCK_GARAGE_ID,
    is_active: true,
  },
  {
    id: 'staff-profile-004',
    user_id: 'user-stf-004',
    staff_code: 'STF004',
    staff_type: 'VEHICLE_CARE_STAFF',
    garage_id: MOCK_GARAGE_ID,
    is_active: true,
  },
]
