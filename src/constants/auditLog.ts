export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  LOGIN: 'Đăng nhập',
  EXPORT: 'Xuất dữ liệu',
  TOGGLE_STATUS: 'Đổi trạng thái',
}

export const AUDIT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'EXPORT',
  'TOGGLE_STATUS',
] as const

export const AUDIT_ENTITIES = [
  'Garage',
  'WashBay',
  'ServicePackage',
  'Promotion',
  'TierRule',
  'Booking',
  'User',
  'StaffProfile',
] as const
