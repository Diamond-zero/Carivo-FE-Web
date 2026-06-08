import type { StaffType } from '../types/staffProfile'

export const STAFF_TYPE_LABELS: Record<StaffType, string> = {
  CUSTOMER_SERVICE_STAFF: 'Tiếp nhận khách',
  VEHICLE_INSPECTION_STAFF: 'Kiểm tra xe',
  WASH_OPERATOR: 'Vận hành rửa',
  VEHICLE_CARE_STAFF: 'Chăm sóc xe',
}

export const STAFF_TYPE_COLORS: Record<StaffType, string> = {
  CUSTOMER_SERVICE_STAFF: 'bg-blue-100 text-blue-700',
  VEHICLE_INSPECTION_STAFF: 'bg-purple-100 text-purple-700',
  WASH_OPERATOR: 'bg-cyan-100 text-cyan-700',
  VEHICLE_CARE_STAFF: 'bg-emerald-100 text-emerald-700',
}

export const STAFF_TYPES: StaffType[] = [
  'CUSTOMER_SERVICE_STAFF',
  'VEHICLE_INSPECTION_STAFF',
  'WASH_OPERATOR',
  'VEHICLE_CARE_STAFF',
]
