import { Gift, Plus, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminPromotionListTable } from '../../../components/admin/promotion/AdminPromotionListTable'
import { CustomerSearchPanel } from '../../../components/customer/CustomerSearchPanel'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Label } from '../../../components/ui/Label'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { DISCOUNT_TYPE_LABELS, DISCOUNT_TYPES } from '../../../constants/promotion'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminPromotions,
  useToggleAdminPromotionStatus,
} from '../../../hooks/api/admin/useAdminPromotions'
import type { DiscountType } from '../../../types/promotion'

export function AdminPromotionListPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [discountTypeFilter, setDiscountTypeFilter] = useState<DiscountType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [confirmPromotionId, setConfirmPromotionId] = useState<string | null>(null)

  const { promotions, allPromotions, isLoading, isError, error } = useAdminPromotions({
    query,
    discountTypeFilter,
    statusFilter,
  })
  const toggleMutation = useToggleAdminPromotionStatus()

  const activeCount = allPromotions.filter((promo) => promo.is_active).length
  const percentageCount = allPromotions.filter(
    (promo) => promo.discount_type === 'PERCENTAGE',
  ).length
  const hasActiveFilter =
    query.trim().length > 0 ||
    discountTypeFilter !== 'ALL' ||
    statusFilter !== 'ALL'

  const pendingPromotion = confirmPromotionId
    ? allPromotions.find((promo) => promo.id === confirmPromotionId)
    : undefined

  const handleConfirmToggle = () => {
    if (!confirmPromotionId || !pendingPromotion) return

    toggleMutation.mutate(
      { promotionId: confirmPromotionId, isActive: !pendingPromotion.is_active },
      {
        onSuccess: (promotion) => {
          setConfirmPromotionId(null)
          showToast(
            promotion.is_active
              ? `Đã kích hoạt ${promotion.code}.`
              : `Đã tạm dừng ${promotion.code}.`,
            'success',
          )
        },
        onError: (mutationError) => {
          showToast(
            getApiErrorMessage(mutationError, 'Không thể thay đổi trạng thái khuyến mãi.'),
            'error',
          )
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div>
        <DashboardPageSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Khuyến mãi" description="Quản lý mã khuyến mãi." />
        <EmptyState
          icon={Gift}
          title="Không thể tải danh sách khuyến mãi"
          description={getApiErrorMessage(error, 'Vui lòng thử lại sau.')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Khuyến mãi"
        description="Quản lý mã khuyến mãi — giảm giá theo %, số tiền, hạng khách và thời gian hiệu lực."
        action={
          <Link to="/admin/promotions/new">
            <Button>
              <Plus className="h-4 w-4" />
              Thêm khuyến mãi
            </Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Tổng mã KM"
          value={allPromotions.length}
          icon={Gift}
          accent="brand"
        />
        <StatCard
          label="Đang chạy"
          value={activeCount}
          icon={Sparkles}
          accent="emerald"
        />
        <StatCard
          label="Giảm theo %"
          value={percentageCount}
          icon={Gift}
          accent="amber"
        />
      </div>

      <div className="mb-6 space-y-4">
        <CustomerSearchPanel
          query={query}
          onChange={setQuery}
          onReset={() => setQuery('')}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="carivo-panel p-4">
            <Label htmlFor="promo-type-filter" className="mb-1.5">
              Loại giảm giá
            </Label>
            <Select
              id="promo-type-filter"
              value={discountTypeFilter}
              onChange={(event) =>
                setDiscountTypeFilter(event.target.value as DiscountType | 'ALL')
              }
            >
              <option value="ALL">Tất cả</option>
              {DISCOUNT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DISCOUNT_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </div>
          <div className="carivo-panel p-4">
            <Label htmlFor="promo-status-filter" className="mb-1.5">
              Trạng thái
            </Label>
            <Select
              id="promo-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
              }
            >
              <option value="ALL">Tất cả</option>
              <option value="ACTIVE">Đang chạy</option>
              <option value="INACTIVE">Tạm dừng</option>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {promotions.length} khuyến mãi
            {hasActiveFilter ? ' (đã lọc)' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <AdminPromotionListTable
            promotions={promotions}
            hasActiveFilter={hasActiveFilter}
            onToggleActive={setConfirmPromotionId}
          />
        </CardContent>
      </Card>

      <Modal
        open={Boolean(confirmPromotionId && pendingPromotion)}
        onClose={() => setConfirmPromotionId(null)}
        title={
          pendingPromotion?.is_active ? 'Tạm dừng khuyến mãi?' : 'Kích hoạt khuyến mãi?'
        }
        description={
          pendingPromotion
            ? `${pendingPromotion.code} — ${pendingPromotion.name}`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmPromotionId(null)}>
            Hủy
          </Button>
          <Button
            variant={pendingPromotion?.is_active ? 'danger' : 'primary'}
            onClick={handleConfirmToggle}
            disabled={toggleMutation.isPending}
          >
            Xác nhận
          </Button>
        </div>
      </Modal>
    </div>
  )
}
