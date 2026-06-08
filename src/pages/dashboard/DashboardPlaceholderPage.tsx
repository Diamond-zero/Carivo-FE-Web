import { LogOut } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { STAFF_TYPE_LABELS } from '../../constants/staffType'
import { useAuth } from '../../contexts/AuthContext'

export function DashboardPlaceholderPage() {
  const { session, logout, isAuthenticated } = useAuth()

  if (!isAuthenticated || !session) {
    return <Navigate to="/login" replace />
  }

  const { user, staffProfile, garage } = session

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
            Carivo Staff
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Đăng nhập thành công
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Dashboard sẽ được xây dựng ở commit tiếp theo.
          </p>
        </div>

        <dl className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Nhân viên</dt>
            <dd className="font-medium text-slate-900">{user.full_name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Mã staff</dt>
            <dd className="font-medium text-slate-900">
              {staffProfile.staff_code}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Vai trò</dt>
            <dd className="font-medium text-slate-900">
              {STAFF_TYPE_LABELS[staffProfile.staff_type]}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Garage</dt>
            <dd className="text-right font-medium text-slate-900">
              {garage.name}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Role hệ thống</dt>
            <dd className="font-medium text-green-700">{user.role}</dd>
          </div>
        </dl>

        <Button
          variant="secondary"
          fullWidth
          className="mt-6"
          onClick={() => {
            logout()
          }}
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </div>
  )
}
