/**
 * Mapping cho trang Nhật ký hệ thống /admin/audit-logs.
 *
 * BE ghi log dưới dạng `action = "DOMAIN_VERB"` (UPPER_SNAKE) và
 * `resource_type = "DOMAIN"` (UPPER_SNAKE). Hai map bên dưới liệt kê
 * các giá trị đã biết; các giá trị chưa có vẫn hiển thị được với tiện ích
 * `humanizeAuditToken` — fallback thân thiện với người dùng.
 */

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  SOFT_DELETE: 'Xóa mềm',
  RESTORE: 'Khôi phục',
  TOGGLE_STATUS: 'Đổi trạng thái',
  LOGIN: 'Đăng nhập',
  LOGOUT: 'Đăng xuất',
  EXPORT: 'Xuất dữ liệu',
  APPROVE: 'Phê duyệt',
  REJECT: 'Từ chối',
  CANCEL: 'Huỷ',
  SCHEDULE: 'Lên lịch',
  APPLY: 'Áp dụng',
  ASSIGN: 'Phân công',
  REASSIGN: 'Phân công lại',
  CLAIM: 'Nhận',
  RELEASE: 'Nhả',
  LOCK: 'Khoá',
  UNLOCK: 'Mở khoá',
  ARCHIVE: 'Lưu trữ',
  UNARCHIVE: 'Khôi phục kho',
  CUSTOMER_VOUCHER_GIFTED: 'Tặng voucher cho customer',
}

export const AUDIT_RESOURCE_TYPE_LABELS: Record<string, string> = {
  GARAGE: 'Chi nhánh',
  WASH_BAY: 'Buồng rửa',
  SERVICE_PACKAGE: 'Gói dịch vụ',
  PROMOTION: 'Khuyến mãi',
  TIER_RULE: 'Quy tắc hạng',
  BOOKING: 'Booking',
  WASH_HISTORY: 'Lịch sử rửa',
  WAITLIST: 'Danh sách chờ',
  ARRIVAL_SCAN: 'Lượt quét biển số',
  CAMERA_DEVICE: 'Camera cổng',
  PLATE_RECOGNITION: 'Nhận diện biển số',
  STAFF_PROFILE: 'Hồ sơ nhân viên',
  STAFF_TYPE_CHANGE_REQUEST: 'Yêu cầu đổi chức năng',
  SURVEY: 'Khảo sát',
  SURVEY_RESPONSE: 'Phản hồi khảo sát',
  LOYALTY_CUSTOMER: 'Khách hàng loyalty',
  POINT_TRANSACTION: 'Giao dịch điểm',
  TIER_ADJUSTMENT: 'Điều chỉnh hạng',
  PAYMENT_TRANSACTION: 'Giao dịch thanh toán',
  REFUND: 'Hoàn tiền',
  UPLOAD: 'Tệp tải lên',
  USER: 'Người dùng',
  ADMIN: 'Quản trị viên',
  CUSTOMER: 'Khách hàng',
  NOTIFICATION: 'Thông báo',
  VOUCHER: 'Voucher',
  CUSTOMER_VOUCHER: 'Voucher customer',
  RESEARCH_REPORT: 'Báo cáo nghiên cứu',
  INCIDENT: 'Sự cố',
  CUSTOMER_CASE: 'Hồ sơ hỗ trợ',
  WALK_IN_BOOKING: 'Booking walk-in',
  STAFF_ASSIGNMENT: 'Phân công nhân viên',
  AUTH: 'Xác thực',
}

export const AUDIT_ACTOR_ROLES = ['ADMIN', 'STAFF', 'SYSTEM', 'CUSTOMER'] as const
export type AuditActorRole = (typeof AUDIT_ACTOR_ROLES)[number]

export const AUDIT_ACTOR_ROLE_LABELS: Record<AuditActorRole, string> = {
  ADMIN: 'Quản trị viên',
  STAFF: 'Nhân viên',
  SYSTEM: 'Hệ thống',
  CUSTOMER: 'Khách hàng',
}

/** Phân loại action (dùng để render badge màu) */
export type AuditActionCategory =
  | 'create'
  | 'update'
  | 'delete'
  | 'auth'
  | 'export'
  | 'status'
  | 'assignment'
  | 'approval'
  | 'other'

export function categorizeAuditAction(action: string): AuditActionCategory {
  const normalized = action.toUpperCase()
  if (['CREATE', 'CUSTOMER_VOUCHER_GIFTED'].includes(normalized)) return 'create'
  if (['UPDATE', 'APPLY', 'SCHEDULE'].includes(normalized)) return 'update'
  if (['DELETE', 'SOFT_DELETE', 'ARCHIVE', 'UNARCHIVE'].includes(normalized)) return 'delete'
  if (['LOGIN', 'LOGOUT', 'LOCK', 'UNLOCK'].includes(normalized)) return 'auth'
  if (['EXPORT'].includes(normalized)) return 'export'
  if (['TOGGLE_STATUS', 'RESTORE'].includes(normalized)) return 'status'
  if (['ASSIGN', 'REASSIGN', 'CLAIM', 'RELEASE'].includes(normalized)) return 'assignment'
  if (['APPROVE', 'REJECT', 'CANCEL'].includes(normalized)) return 'approval'
  return 'other'
}

/**
 * BE lưu `action` ở dạng UPPER_SNAKE. Hàm này chuyển sang dạng dễ đọc:
 *  - Ưu tiên tra trong `AUDIT_ACTION_LABELS` (đã Việt hoá)
 *  - Nếu action dạng "DOMAIN_VERB" (vd. USER_LOGIN) → lấy phần VERB
 *  - Fallback: chuyển "UPPER_SNAKE" → "Upper Snake"
 */
export function humanizeAuditAction(action: string): string {
  if (!action) return '—'
  const upper = action.toUpperCase()
  if (AUDIT_ACTION_LABELS[upper]) return AUDIT_ACTION_LABELS[upper]
  const segments = upper.split('_')
  const verb = segments[segments.length - 1]
  if (verb && AUDIT_ACTION_LABELS[verb]) return AUDIT_ACTION_LABELS[verb]
  return segments
    .map((segment) =>
      segment.toLowerCase().replace(/^./, (char) => char.toUpperCase()),
    )
    .join(' ')
}

export function humanizeAuditResource(resource: string): string {
  if (!resource) return '—'
  const upper = resource.toUpperCase()
  if (AUDIT_RESOURCE_TYPE_LABELS[upper]) return AUDIT_RESOURCE_TYPE_LABELS[upper]
  return upper
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^./, (char) => char.toUpperCase())
}
