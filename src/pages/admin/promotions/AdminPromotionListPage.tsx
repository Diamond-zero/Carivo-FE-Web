import { Gift, Loader2, Plus, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
import { LOYALTY_TIER_LABELS } from '../../../constants/loyaltyTier'
import { useToast } from '../../../contexts/ToastContext'
import {
  ADMIN_PROMOTION_PAGE_SIZE,
  PROMOTION_AUDIENCES,
  PROMOTION_AUDIENCE_LABELS,
  useAdminPromotions,
  useDeleteAdminPromotion,
  useToggleAdminPromotionStatus,
  type AdminPromotionStatusFilter,
} from '../../../hooks/api/admin/useAdminPromotions'
import type { DiscountType, LoyaltyTier, PromotionAudience } from '../../../types/promotion'

type ModalState =
  | { kind: 'toggle'; promotionId: string }
  | { kind: 'delete'; promotionId: string }
  | null

export function AdminPromotionListPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [discountTypeFilter, setDiscountTypeFilter] = useState<DiscountType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<AdminPromotionStatusFilter>('ALL')
  const [audienceFilter, setAudienceFilter] = useState<PromotionAudience | 'ALL'>('ALL')
  const [tierFilter, setTierFilter] = useState<LoyaltyTier | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<ModalState>(null)

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(handle)
  }, [query])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, audienceFilter, tierFilter])

  const { promotions, allPromotions, meta, isLoading, isFetching, isError, error } =
    useAdminPromotions({
      query: debouncedQuery,
      discount_type:
        discountTypeFilter === 'ALL' ? undefined : discountTypeFilter,
      audience: audienceFilter === 'ALL' ? undefined : audienceFilter,
      tier: tierFilter === 'ALL' ? undefined : tierFilter,
      statusFilter,
      page,
      limit: ADMIN_PROMOTION_PAGE_SIZE,
    })

  const toggleMutation = useToggleAdminPromotionStatus()
  const deleteMutation = useDeleteAdminPromotion()

  const total = meta?.total ?? allPromotions.length
  const totalPages = meta?.total_pages ?? 1
  const activeCount = useMemo(
    () => allPromotions.filter((promo) => promo.is_active).length,
    [allPromotions],
  )
  const percentageCount = useMemo(
    () => allPromotions.filter((promo) => promo.discount_type === 'PERCENTAGE').length,
    [allPromotions],
  )

  const hasActiveFilter =
    debouncedQuery.length > 0 ||
    discountTypeFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    audienceFilter !== 'ALL' ||
    tierFilter !== 'ALL'

  const pendingPromotion = modal
    ? allPromotions.find((promo) => promo.id === modal.promotionId)
    : undefined

  const handleConfirmToggle = () => {
    if (!modal || modal.kind !== 'toggle' || !pendingPromotion) return

    toggleMutation.mutate(
      { promotionId: modal.promotionId, isActive: !pendingPromotion.is_active },
      {
        onSuccess: (promotion) => {
          setModal(null)
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

  const handleConfirmDelete = () => {
    if (!modal || modal.kind !== 'delete' || !pendingPromotion) return

    deleteMutation.mutate(modal.promotionId, {
      onSuccess: () => {
        setModal(null)
        showToast(`Đã xóa khuyến mãi ${pendingPromotion.code}.`, 'success')
      },
      onError: (mutationError) => {
        showToast(
          getApiErrorMessage(
            mutationError,
            'Không thể xóa khuyến mãi — có thể đã có lịch sử sử dụng.',
          ),
          'error',
        )
      },
    })
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
        <StatCard label="Tổng mã KM" value={total} icon={Gift} accent="brand" />
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                setStatusFilter(event.target.value as AdminPromotionStatusFilter)
              }
            >
              <option value="ALL">Tất cả</option>
              <option value="ACTIVE">Đang chạy</option>
              <option value="INACTIVE">Tạm dừng</option>
            </Select>
          </div>
          <div className="carivo-panel p-4">
            <Label htmlFor="promo-audience-filter" className="mb-1.5">
              Đối tượng
            </Label>
            <Select
              id="promo-audience-filter"
              value={audienceFilter}
              onChange={(event) =>
                setAudienceFilter(event.target.value as PromotionAudience | 'ALL')
              }
            >
              <option value="ALL">Tất cả</option>
              {PROMOTION_AUDIENCES.map((audience) => (
                <option key={audience} value={audience}>
                  {PROMOTION_AUDIENCE_LABELS[audience]}
                </option>
              ))}
            </Select>
          </div>
          <div className="carivo-panel p-4">
            <Label htmlFor="promo-tier-filter" className="mb-1.5">
              Hạng áp dụng
            </Label>
            <Select
              id="promo-tier-filter"
              value={tierFilter}
              onChange={(event) =>
                setTierFilter(event.target.value as LoyaltyTier | 'ALL')
              }
            >
              <option value="ALL">Tất cả</option>
              {(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as LoyaltyTier[]).map(
                (tier) => (
                  <option key={tier} value={tier}>
                    {LOYALTY_TIER_LABELS[tier]}
                  </option>
                ),
              )}
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {promotions.length} khuyến mãi
            {hasActiveFilter ? ' (đã lọc)' : ''}
            {meta ? ` · Trang ${meta.page}/${meta.total_pages}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <AdminPromotionListTable
            promotions={promotions}
            hasActiveFilter={hasActiveFilter}
            onToggleActive={(promotionId) => setModal({ kind: 'toggle', promotionId })}
            onDelete={(promotionId) => setModal({ kind: 'delete', promotionId })}
          />
        </CardContent>
        {meta && meta.total_pages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-sm text-slate-600">
            <span>
              Trang {meta.page} / {meta.total_pages} · {meta.total} bản ghi
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || isFetching}
              >
                Trước
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page >= totalPages || isFetching}
              >
                Sau
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <Modal
        open={Boolean(modal && pendingPromotion)}
        onClose={() => !deleteMutation.isPending && !toggleMutation.isPending && setModal(null)}
        title={
          modal?.kind === 'delete'
            ? 'Xóa khuyến mãi?'
            : pendingPromotion?.is_active
              ? 'Tạm dừng khuyến mãi?'
              : 'Kích hoạt khuyến mãi?'
        }
        description={
          pendingPromotion
            ? `${pendingPromotion.code} — ${pendingPromotion.name}`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setModal(null)}
            disabled={deleteMutation.isPending || toggleMutation.isPending}
          >
            Hủy
          </Button>
          {modal?.kind === 'delete' ? (
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                'Xóa'
              )}
            </Button>
          ) : (
            <Button
              variant={pendingPromotion?.is_active ? 'danger' : 'primary'}
              onClick={handleConfirmToggle}
              disabled={toggleMutation.isPending}
            >
              {toggleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận'
              )}
            </Button>
          )}
        </div>
      </Modal>
    </div>
  )
}