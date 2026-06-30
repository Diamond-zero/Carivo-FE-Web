import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Bell } from 'lucide-react'

import { Card } from '../../../components/ui/Card'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Badge } from '../../../components/ui/Badge'
import { getApiErrorMessage } from '../../../api/client'
import { useAdminCustomer } from '../../../hooks/api/admin/useAdminCustomers'
import { useAdminCustomerNotifications } from '../../../hooks/api/admin/useAdminCustomerExtras'
import { formatDateTime } from '../../../utils/format'

export function AdminCustomerNotificationsPage() {
  const { id } = useParams<{ id: string }>()
  const customerId = id ?? ''
  const { customer } = useAdminCustomer(customerId)
  const { data, isLoading, isError, error } = useAdminCustomerNotifications(customerId, {
    limit: 50,
  })

  const notifications = data?.notifications ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Thông báo của ${customer?.full_name ?? 'khách hàng'}`}
        subtitle="Xem các thông báo đã gửi tới khách trong hệ thống."
        action={
          <Button variant="secondary" as={Link} to={`/admin/users/customers/${customerId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
        }
      />

      <Card className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">Đang tải thông báo...</div>
        ) : isError ? (
          <EmptyState
            icon={Bell}
            title="Không thể tải thông báo"
            description={getApiErrorMessage(error, 'Vui lòng thử lại sau.')}
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Chưa có thông báo"
            description="Khách hàng này chưa nhận thông báo nào trong hệ thống."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <li key={notification.id} className="flex items-start gap-4 px-6 py-4">
                <div className="mt-1 inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {notification.title}
                    </p>
                    {notification.is_read ? (
                      <Badge tone="neutral">Đã đọc</Badge>
                    ) : (
                      <Badge tone="brand">Chưa đọc</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{notification.body}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {notification.created_at ? formatDateTime(notification.created_at) : '—'}
                    {notification.type ? ` • ${notification.type}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}