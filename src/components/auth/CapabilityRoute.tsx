import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  type StaffCapability,
} from '../../constants/staffCapabilities'
import { useCan } from '../../hooks/useCan'

interface CapabilityRouteProps {
  /**
   * Capability yêu cầu để vào route. Có thể truyền 1 hoặc nhiều capability —
   * khi truyền mảng, staff chỉ cần có ÍT NHẤT 1 (logic OR) là vào được.
   * Ví dụ `/service/execution` chấp nhận cả WASH_OPERATOR (rửa) và
   * VEHICLE_CARE_STAFF (chăm sóc xe).
   */
  capability: StaffCapability | StaffCapability[]
  /** Đường dẫn redirect khi Staff không có capability. Mặc định `/dashboard`. */
  redirectTo?: string
}

/**
 * Route guard — chỉ render `Outlet` nếu Staff hiện tại có capability yêu cầu.
 * Dùng kết hợp với `ProtectedRoute` để bảo vệ các trang chỉ dành cho một số
 * staff_type (ví dụ `/service/execution` chỉ WASH_OPERATOR/CARE_STAFF).
 */
export function CapabilityRoute({
  capability,
  redirectTo = '/dashboard',
}: CapabilityRouteProps) {
  const { isAuthenticated, isInitializing } = useAuth()
  const allowed = useCan(capability)

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!allowed) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
