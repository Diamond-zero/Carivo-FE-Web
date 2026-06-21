import { AlertTriangle, Coins, Loader2, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../../api/client'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminExpiringPoints,
  useExpireLoyaltyPoints,
} from '../../../hooks/api/admin/useAdminLoyaltyOverview'
import { formatDateTime } from '../../../utils/format'

export function AdminLoyaltyOverviewPage() {
  const { showToast } = useToast()
  const [days, setDays] = useState(30)
  const { data, isLoading, isError, error, refetch } = useAdminExpiringPoints({ days })
  const expireMutation = useExpireLoyaltyPoints()

  const items = data?.items ?? []
  const totalPoints = items.reduce((sum, item) => sum + item.points, 0)

  useEffect(() => {
    if (isError) {
      showToast(getApiErrorMessage(error, 'Không tải được điểm sắp hết hạn.'), 'error')
    }
  }, [isError, error, showToast])

  const handleExpireJob = async () => {
    try {
      const result = await expireMutation.mutateAsync()
      showToast(
        `Đã chạy job hết hạn điểm${result.expired_count != null ? ` (${result.expired_count} giao dịch)` : ''}.`,
        'success',
      )
      void refetch()
    } catch (mutationError) {
      showToast(getApiErrorMessage(mutationError, 'Không chạy được job hết hạn điểm.'), 'error')
    }
  }

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Quản trị"
            title="Tổng quan điểm thưởng"
            description="Theo dõi điểm sắp hết hạn và chạy job xử lý hết hạn điểm tích lũy."
            action={
              <Button
                variant="secondary"
                onClick={() => void handleExpireJob()}
                disabled={expireMutation.isPending}
              >
                {expireMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang chạy...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Chạy job hết hạn điểm
                  </>
                )}
              </Button>
            }
          />

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Giao dịch sắp hết hạn"
              value={items.length}
              icon={AlertTriangle}
              accent="amber"
            />
            <StatCard
              label="Tổng điểm"
              value={totalPoints.toLocaleString('vi-VN')}
              icon={Coins}
              accent="brand"
            />
            <StatCard label="Cửa sổ (ngày)" value={days} icon={RefreshCw} accent="violet" />
          </div>

          <div className="mb-4 flex gap-2">
            {[7, 30, 90].map((value) => (
              <Button
                key={value}
                size="sm"
                variant={days === value ? 'primary' : 'secondary'}
                onClick={() => setDays(value)}
              >
                {value} ngày
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Điểm sắp hết hạn</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Khách hàng</th>
                    <th className="px-6 py-3">Điểm</th>
                    <th className="px-6 py-3">Hết hạn</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100/80 hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {item.customer?.full_name ?? item.customer_id}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {item.points.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDateTime(item.expires_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-500">
                  Không có điểm sắp hết hạn trong {days} ngày tới.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
