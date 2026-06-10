import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

export function AdminProtectedRoute() {
  const { isAuthenticated, session } = useAdminAuth()

  if (!isAuthenticated || session?.user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
