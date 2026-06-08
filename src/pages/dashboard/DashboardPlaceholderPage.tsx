import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

export function DashboardPlaceholderPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">
          Đăng nhập mock thành công. Trang dashboard sẽ được xây dựng ở commit
          tiếp theo.
        </p>
        <Link to="/login" className="mt-6 inline-block">
          <Button variant="secondary">Quay lại đăng nhập</Button>
        </Link>
      </div>
    </div>
  )
}
