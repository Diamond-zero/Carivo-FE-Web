export const SOURCE_FILTER_VALUES = [
  'ALL',
  'STAFF_SELF_REQUEST',
  'ADMIN_DIRECTED',
] as const
export type SourceFilterValue = (typeof SOURCE_FILTER_VALUES)[number]

export interface AdminStaffTypeChangeRequestFilters {
  query: string
  status: string
  source: SourceFilterValue
}

export const DEFAULT_ADMIN_STAFF_TYPE_CHANGE_REQUEST_FILTERS: AdminStaffTypeChangeRequestFilters =
  {
    query: '',
    status: 'ALL',
    source: 'ALL',
  }

export const ADMIN_STAFF_TYPE_CHANGE_STATUS_OPTIONS: Array<{
  value: string
  label: string
}> = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'REQUESTED', label: 'Đang chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'SCHEDULED', label: 'Đã lên lịch' },
  { value: 'APPLIED', label: 'Đã áp dụng' },
  { value: 'REJECTED', label: 'Bị từ chối' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'FAILED', label: 'Thất bại' },
]

export const ADMIN_STAFF_TYPE_CHANGE_SOURCE_OPTIONS: Array<{
  value: SourceFilterValue
  label: string
}> = [
  { value: 'ALL', label: 'Tất cả nguồn' },
  { value: 'STAFF_SELF_REQUEST', label: 'Nhân viên đề nghị' },
  { value: 'ADMIN_DIRECTED', label: 'Admin điều chuyển' },
]

export function hasActiveAdminStaffTypeChangeRequestFilters(
  filters: AdminStaffTypeChangeRequestFilters,
) {
  return (
    filters.query.trim().length > 0 ||
    filters.status !== 'ALL' ||
    filters.source !== 'ALL'
  )
}

export function filterAdminStaffTypeChangeRequests<
  T extends {
    id: string
    staff_profile_id: string
    status: string
    request_source?: string | null
  },
>(filters: AdminStaffTypeChangeRequestFilters, requests: T[]): T[] {
  const q = filters.query.trim().toLowerCase()
  return requests.filter((req) => {
    if (filters.status !== 'ALL' && req.status !== filters.status) {
      return false
    }
    if (filters.source !== 'ALL' && req.request_source !== filters.source) {
      return false
    }
    if (!q) return true
    return (
      req.id.toLowerCase().includes(q) ||
      req.staff_profile_id.toLowerCase().includes(q)
    )
  })
}
