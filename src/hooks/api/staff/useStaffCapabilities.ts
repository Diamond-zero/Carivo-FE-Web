import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/AuthContext'
import { getMyStaffCapabilitiesApi } from '../../../api/staffCapabilities.api'
import type {
  ApiStaffCapabilitiesResponse,
  StaffCapabilityKey,
} from '../../../types/api/staffCapabilities'
import { staffQueryKeys } from './queryKeys'

/**
 * Hook lấy workspace + capability của staff đang đăng nhập từ API.
 *
 * Dùng hook này thay vì `useCan()` / `useStaffCapabilities()` trong hooks/useCan.ts
 * (cái đó dùng hardcoded mapping theo staff_type — không còn được dùng nữa).
 *
 * Capability là feature flag server-driven: nếu staff không có capability
 * thì UI phải ẩn nút hành động tương ứng.
 *
 * Mặc định: chỉ fetch khi đã đăng nhập staff, stale 30s,
 * refetch khi mount để đảm bảo capability đồng bộ với phiên làm việc hiện tại.
 */
export function useStaffCapabilityContext() {
  const { session } = useAuth()
  const isStaff =
    Boolean(session) && (session?.user?.role === 'STAFF' || !session?.user?.role)

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
 * if (can('booking.check_in')) { ... }
 * ```
 */
export function useCanStaffCapability() {
  const query = useStaffCapabilityContext()
  // apiClient.get() đã unwrap 1 lần (data.data → { is_admin, capabilities, ... })
  // nên query.data là object đó, chỉ cần query.data?.capabilities
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

/**
 * Hook lấy danh sách capability của staff hiện tại.
 * Dùng cho sidebar filter, button visibility, route guards.
 *
 * ```ts
 * const capabilities = useMyCapabilities()
 * if (capabilities.includes('booking.check_in')) { ... }
 * ```
 */
export function useMyCapabilities(): StaffCapabilityKey[] {
  const query = useStaffCapabilityContext()
  // apiClient.get() đã unwrap 1 lần (data.data → { is_admin, capabilities, ... })
  return query.data?.capabilities ?? []
}
