import { Navigate, Outlet } from 'react-router-dom'
import { RouteLoadingFallback } from '../ui/RouteLoadingFallback'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

export function AdminProtectedRoute() {
  const { isAuthenticated, isInitializing, session } = useAdminAuth()

  if (isInitializing) {
    return <RouteLoadingFallback />
  }

  if (!isAuthenticated || session?.user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
