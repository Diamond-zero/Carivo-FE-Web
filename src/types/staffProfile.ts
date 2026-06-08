export type StaffType =
  | 'CUSTOMER_SERVICE_STAFF'
  | 'VEHICLE_INSPECTION_STAFF'
  | 'WASH_OPERATOR'
  | 'VEHICLE_CARE_STAFF'

export interface StaffProfile {
  id: string
  user_id: string
  staff_code: string
  staff_type: StaffType
  garage_id: string
  is_active: boolean
}
