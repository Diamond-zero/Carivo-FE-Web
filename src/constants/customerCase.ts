import type {
  CustomerCaseCategory,
} from '../types/api/customerCase'

export const CASE_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Mới gửi',
  ACKNOWLEDGED: 'Đã tiếp nhận',
  INVESTIGATING: 'Đang xác minh',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
}

export const CASE_STATUS_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  SUBMITTED: 'warning',
  ACKNOWLEDGED: 'info',
  INVESTIGATING: 'info',
  RESOLVED: 'success',
  CLOSED: 'default',
}

export const CASE_PRIORITY_LABELS: Record<string, string> = {
  NORMAL: 'Bình thường',
  HIGH: 'Cao',
  CRITICAL: 'Nghiêm trọng',
}

export const CASE_PRIORITY_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  NORMAL: 'info',
  HIGH: 'warning',
  CRITICAL: 'danger',
}

export const CASE_CATEGORY_OPTIONS: Array<{
  value: CustomerCaseCategory
  label: string
}> = [
  { value: 'SERVICE_QUALITY', label: 'Chất lượng dịch vụ' },
  { value: 'SERVICE_INCOMPLETE', label: 'Dịch vụ chưa hoàn tất' },
  { value: 'VEHICLE_DAMAGE', label: 'Hư hỏng xe' },
  { value: 'MISSING_PROPERTY', label: 'Thất lạc tài sản' },
  { value: 'BILLING_PAYMENT', label: 'Thanh toán' },
  { value: 'STAFF_CONDUCT', label: 'Ứng xử nhân viên' },
  { value: 'SAFETY_CONCERN', label: 'Vấn đề an toàn' },
  { value: 'OTHER', label: 'Khác' },
]

export const CASE_CATEGORY_LABELS: Record<CustomerCaseCategory, string> =
  Object.fromEntries(
    CASE_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
  ) as Record<CustomerCaseCategory, string>

export const TECHNICAL_CASE_CATEGORIES: CustomerCaseCategory[] = [
  'VEHICLE_DAMAGE',
  'SERVICE_QUALITY',
  'SERVICE_INCOMPLETE',
  'SAFETY_CONCERN',
]
