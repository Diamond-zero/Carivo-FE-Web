import { LogOut, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'

export function AdminSettingsPage() {
  const navigate = useNavigate()
  const { session, logout } = useAdminAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!session) return null

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Admin"
        title="Cài đặt tài khoản"
        description="Thông tin quản trị viên hệ thống Carivo."
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-600" />
            Hồ sơ Admin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Họ tên', value: session.user.full_name },
              { label: 'Số điện thoại', value: session.user.phone },
              { label: 'Email', value: session.user.email ?? '—' },
              {
                label: 'Vai trò',
                value: (
                  <Badge className="bg-violet-50 text-violet-800 ring-violet-200">
                    ADMIN
                  </Badge>
                ),
              },
            ].map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {row.label}
                </p>
                <div className="mt-1 font-semibold text-slate-900">{row.value}</div>
              </div>
            ))}
          </div>

          <Button variant="secondary" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
