import { Gift, Plus, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPromotionListTable } from '../../../components/admin/promotion/AdminPromotionListTable'
import { CustomerSearchPanel } from '../../../components/customer/CustomerSearchPanel'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Label } from '../../../components/ui/Label'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { DISCOUNT_TYPE_LABELS, DISCOUNT_TYPES } from '../../../constants/promotion'
import { useToast } from '../../../contexts/ToastContext'
import { useInitialPageSkeleton } from '../../../hooks/useInitialPageSkeleton'
import { toggleAdminPromotionActive } from '../../../mocks/admin/adminPromotionStore'
import type { DiscountType } from '../../../types/promotion'
import { searchAdminPromotions } from '../../../utils/adminPromotionLookup'

export function AdminPromotionListPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [discountTypeFilter, setDiscountTypeFilter] = useState<DiscountType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [refreshKey, setRefreshKey] = useState(0)
  const [confirmPromotionId, setConfirmPromotionId] = useState<string | null>(null)
  const isLoading = useInitialPageSkeleton(280)

  const promotions = useMemo(
    () => searchAdminPromotions(query, discountTypeFilter, statusFilter),
    [query, discountTypeFilter, statusFilter, refreshKey],
  )

  const allPromotions = useMemo(
    () => searchAdminPromotions('', 'ALL', 'ALL'),
    [refreshKey],
  )
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
    if (!confirmPromotionId) return

    const result = toggleAdminPromotionActive(confirmPromotionId)
    setConfirmPromotionId(null)

    if (!result.ok) {
      showToast(result.message, 'error')
      return
    }

    setRefreshKey((value) => value + 1)
    showToast(
      result.promotion.is_active
        ? `Đã kích hoạt ${result.promotion.code}.`
        : `Đã tạm dừng ${result.promotion.code}.`,
      'success',
    )
  }

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Admin"
            title="Promotions"
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
              >
                Xác nhận
              </Button>
            </div>
          </Modal>
        </>
      )}
    </div>
  )
}
