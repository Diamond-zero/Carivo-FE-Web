import type { StaffType } from '../types/staffProfile'

export const STAFF_TYPE_LABELS: Record<StaffType, string> = {
  CUSTOMER_SERVICE_STAFF: 'Tiếp nhận khách',
  VEHICLE_INSPECTION_STAFF: 'Kiểm tra xe',
  WASH_OPERATOR: 'Vận hành rửa',
  VEHICLE_CARE_STAFF: 'Chăm sóc xe',
}

export const STAFF_TYPE_COLORS: Record<StaffType, string> = {
  CUSTOMER_SERVICE_STAFF: 'bg-brand-50 text-brand-800 ring-brand-200',
  VEHICLE_INSPECTION_STAFF: 'bg-violet-50 text-violet-800 ring-violet-200',
  WASH_OPERATOR: 'bg-cyan-50 text-cyan-800 ring-cyan-200',
  VEHICLE_CARE_STAFF: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
}

export const STAFF_TYPES: StaffType[] = [
  'CUSTOMER_SERVICE_STAFF',
  'VEHICLE_INSPECTION_STAFF',
  'WASH_OPERATOR',
  'VEHICLE_CARE_STAFF',
]
