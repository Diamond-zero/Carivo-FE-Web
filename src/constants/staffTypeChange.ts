import type {
  StaffTypeChangeRequestSource,
  StaffTypeChangeStatus,
} from '../api/staffTypeChange.api'
import type { StaffType } from '../types/staffProfile'

/**
 * Nhãn tiếng Việt cho các trạng thái của yêu cầu đổi chức năng nhân viên.
 *
 * Mapping theo BE: REQUESTED → APPROVED → SCHEDULED → APPLIED,
 * REJECTED/CANCELLED/FAILED là terminal state.
 */
export const STAFF_TYPE_CHANGE_STATUS_LABELS: Record<
  StaffTypeChangeStatus,
  string
> = {
  REQUESTED: 'Đang chờ duyệt',
  APPROVED: 'Đã duyệt',
  SCHEDULED: 'Đã lên lịch áp dụng',
  APPLIED: 'Đã áp dụng',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã hủy',
  FAILED: 'Áp dụng thất bại',
}

export const STAFF_TYPE_CHANGE_STATUS_COLORS: Record<
  StaffTypeChangeStatus,
  string
> = {
  REQUESTED: 'bg-amber-100 text-amber-800 ring-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  SCHEDULED: 'bg-blue-100 text-blue-800 ring-blue-200',
  APPLIED: 'bg-brand-100 text-brand-800 ring-brand-200',
  REJECTED: 'bg-red-100 text-red-800 ring-red-200',
  CANCELLED: 'bg-slate-100 text-slate-700 ring-slate-200',
  FAILED: 'bg-red-100 text-red-800 ring-red-200',
}

/**
 * Nhãn tiếng Việt cho nguồn khởi tạo yêu cầu (BE field `request_source`).
 */
export const STAFF_TYPE_CHANGE_SOURCE_LABELS: Record<
  StaffTypeChangeRequestSource,
  string
> = {
  STAFF_SELF_REQUEST: 'Nhân viên đề nghị',
  ADMIN_DIRECTED: 'Admin điều chuyển',
}

export const STAFF_TYPE_CHANGE_SOURCE_COLORS: Record<
  StaffTypeChangeRequestSource,
  string
> = {
  STAFF_SELF_REQUEST: 'bg-sky-100 text-sky-800 ring-sky-200',
  ADMIN_DIRECTED: 'bg-violet-100 text-violet-800 ring-violet-200',
}

/**
 * Các trạng thái cho phép admin duyệt / từ chối.
 */
export const APPROVABLE_STATUSES: StaffTypeChangeStatus[] = [
  'REQUESTED',
]

/**
 * Trạng thái còn có thể bị hủy (REQUESTED hoặc APPROVED/SCHEDULED chưa APPLIED).
 */
export const CANCELLABLE_STATUSES: StaffTypeChangeStatus[] = [
  'REQUESTED',
  'APPROVED',
  'SCHEDULED',
]

/**
 * Mapping staff type → gợi ý thao tác sẽ bị thay đổi. Hiển thị cho admin
 * trong modal "Yêu cầu chuyển chức năng".
 */
export const STAFF_TYPE_TRANSITION_HINTS: Record<StaffType, string> = {
  CUSTOMER_SERVICE_STAFF:
    'Tiếp nhận booking, check-in, hỗ trợ thanh toán, tạo walk-in.',
  VEHICLE_INSPECTION_STAFF:
    'Kiểm tra xe trước/sau rửa, upload hình ảnh.',
  WASH_OPERATOR: 'Vận hành buồng rửa, chạy service workflow.',
  VEHICLE_CARE_STAFF:
    'Lau khô, vệ sinh nội/ngoại thất, hoàn tất handover.',
}

export const STAFF_TYPE_TRANSITION_TASKS: Record<
  StaffType,
  { gained: string[]; lost: string[] }
> = {
  CUSTOMER_SERVICE_STAFF: {
    gained: ['Tạo walk-in', 'Check-in booking', 'Hỗ trợ thanh toán'],
    lost: ['Vận hành buồng rửa', 'Kiểm tra xe'],
  },
  VEHICLE_INSPECTION_STAFF: {
    gained: ['Tạo hồ sơ kiểm tra trước/sau rửa'],
    lost: ['Tiếp nhận booking', 'Vận hành buồng rửa'],
  },
  WASH_OPERATOR: {
    gained: ['Vận hành buồng rửa', 'Pause/resume service workflow'],
    lost: ['Tiếp nhận booking', 'Kiểm tra xe'],
  },
  VEHICLE_CARE_STAFF: {
    gained: ['Lau khô, vệ sinh', 'Hoàn tất handover'],
    lost: ['Tiếp nhận booking', 'Vận hành buồng rửa'],
  },
}
