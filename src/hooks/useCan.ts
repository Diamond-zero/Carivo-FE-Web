import { useAuth } from '../contexts/AuthContext'
import {
  STAFF_TYPE_CAPABILITIES,
  type StaffCapability,
} from '../constants/staffCapabilities'

/**
 * Hook kiểm tra Staff hiện tại có capability hay không.
 * Trả `false` nếu chưa đăng nhập hoặc staff_type không khớp mapping.
 */
export function useCan(capability: StaffCapability): boolean {
  const { session } = useAuth()
  const staffType = session?.staffProfile.staff_type
  if (!staffType) return false
  const allowed = STAFF_TYPE_CAPABILITIES[staffType]
  return allowed?.includes(capability) ?? false
}

/**
 * Hook lấy toàn bộ capability của Staff hiện tại (dùng cho sidebar filter).
 */
export function useStaffCapabilities(): StaffCapability[] {
  const { session } = useAuth()
  const staffType = session?.staffProfile.staff_type
  if (!staffType) return []
  return STAFF_TYPE_CAPABILITIES[staffType] ?? []
}
