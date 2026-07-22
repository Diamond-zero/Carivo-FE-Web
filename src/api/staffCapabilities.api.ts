import type { ApiResponse } from '../types/api'
import type { ApiStaffCapabilitiesResponse } from '../types/api/staffCapabilities'
import { apiClient } from './client'

/**
 * BE: `GET /staff-profiles/me/capabilities`
 *
 * Trả về workspace của nhân viên hiện tại + danh sách capability mà staff
 * đó được phép dùng. FE sử dụng để ẩn/hiện các action button trong
 * booking detail, service workflow, customer case, v.v.
 */
export async function getMyStaffCapabilitiesApi() {
  const { data } = await apiClient.get<ApiResponse<ApiStaffCapabilitiesResponse>>(
    '/staff-profiles/me/capabilities',
  )
  return data.data
}
