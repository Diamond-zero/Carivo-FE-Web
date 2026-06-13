import type { ServiceType } from '../types/servicePackage'

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  WASH: 'Rửa xe',
  ADDON: 'Dịch vụ thêm',
  COMBO: 'Combo',
}

export const SERVICE_TYPE_COLORS: Record<ServiceType, string> = {
  WASH: 'bg-brand-50 text-brand-800 ring-brand-200',
  ADDON: 'bg-violet-50 text-violet-800 ring-violet-200',
  COMBO: 'bg-amber-50 text-amber-800 ring-amber-200',
}

export const SERVICE_TYPES: ServiceType[] = ['WASH', 'ADDON', 'COMBO']
