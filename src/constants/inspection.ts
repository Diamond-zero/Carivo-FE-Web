import type { InspectionType } from '../types/inspection'

export const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  BEFORE_WASH: 'Trước khi rửa',
  AFTER_WASH: 'Sau khi rửa',
}

export const INSPECTION_TYPE_DESCRIPTIONS: Record<InspectionType, string> = {
  BEFORE_WASH: 'Ghi nhận tình trạng xe trước khi bắt đầu rửa',
  AFTER_WASH: 'Ghi nhận tình trạng xe sau khi hoàn thành dịch vụ',
}
