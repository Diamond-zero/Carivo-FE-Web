import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/AuthContext'
import { getMyStaffCapabilitiesApi } from '../../../api/staffCapabilities.api'
import type {
  ApiStaffCapabilitiesResponse,
  StaffCapabilityKey,
} from '../../../types/api/staffCapabilities'
import { staffQueryKeys } from './queryKeys'

/**
 * Hook lấy workspace + capability của staff đang đăng nhập.
 *
 * Capability là một "feature flag" server-driven: nếu staff không có
 * `booking.cancel` thì UI phải ẩn nút hủy, không phải ẩn sau khi bấm.
 *
 * Mặc định: chỉ fetch khi đã đăng nhập staff, stale 30s, refetch khi
 * mount để đảm bảo capability đồng bộ với phiên làm việc hiện tại.
 */
export function useStaffCapabilities() {
  const { session } = useAuth()
  const isStaff = Boolean(session) && !session?.user?.role || session?.user?.role === 'STAFF'

  const query = useQuery({
    queryKey: staffQueryKeys.capabilities,
    queryFn: getMyStaffCapabilitiesApi,
    enabled: isStaff,
    staleTime: 30_000,
    refetchOnMount: 'always',
    retry: 0,
  })

  return query
}

/**
 * Hook tiện ích — trả về hàm kiểm tra capability.
 *
 * ```ts
 * const { can, capabilities } = useCanStaffCapability()
 * if (can('booking.cancel')) { ... }
 * ```
 */
export function useCanStaffCapability() {
  const query = useStaffCapabilities()
  const capabilities: StaffCapabilityKey[] = query.data?.capabilities ?? []

  return {
    capabilities,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    can: (key: StaffCapabilityKey) => capabilities.includes(key),
    refresh: query.refetch,
    data: query.data as ApiStaffCapabilitiesResponse | undefined,
  }
}
