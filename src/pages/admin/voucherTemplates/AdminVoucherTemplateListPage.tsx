import { Coins, Loader2, Plus, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminVoucherTemplateListTable } from '../../../components/admin/voucherTemplate/AdminVoucherTemplateListTable'
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
import { VOUCHER_TEMPLATE_TYPE_LABELS, VOUCHER_TEMPLATE_TYPES } from '../../../constants/voucherTemplate'
import { getTierLabel } from '../../../constants/loyaltyTier'
import { useToast } from '../../../contexts/ToastContext'
import {
  ADMIN_VOUCHER_TEMPLATE_PAGE_SIZE,
  useAdminVoucherTemplates,
  useDeleteAdminVoucherTemplate,
  useToggleAdminVoucherTemplateStatus,
  type AdminVoucherTemplateStatusFilter,
} from '../../../hooks/api/admin/useAdminVoucherTemplates'
import { useAdminTierRules } from '../../../hooks/api/admin/useAdminTierRules'
import type { LoyaltyTier } from '../../../types/loyalty'
import type { VoucherType } from '../../../types/voucherTemplate'

type ModalState =
  | { kind: 'toggle'; voucherTemplateId: string }
  | { kind: 'delete'; voucherTemplateId: string }
  | null

export function AdminVoucherTemplateListPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<VoucherType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<AdminVoucherTemplateStatusFilter>('ALL')
  const [tierFilter, setTierFilter] = useState<LoyaltyTier | 'ALL'>('ALL')
  const loyaltyTiersQuery = useAdminTierRules()
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
  }, [statusFilter, typeFilter, tierFilter])

  const { voucherTemplates, allVoucherTemplates, meta, isLoading, isFetching, isError, error } =
    useAdminVoucherTemplates({
      query: debouncedQuery,
      voucher_type: typeFilter === 'ALL' ? undefined : typeFilter,
      tier: tierFilter === 'ALL' ? undefined : tierFilter,
      statusFilter,
      page,
      limit: ADMIN_VOUCHER_TEMPLATE_PAGE_SIZE,
    })

  const toggleMutation = useToggleAdminVoucherTemplateStatus()
  const deleteMutation = useDeleteAdminVoucherTemplate()

  const total = meta?.total ?? allVoucherTemplates.length
  const totalPages = meta?.total_pages ?? 1
  const activeCount = useMemo(
    () => allVoucherTemplates.filter((item) => item.is_active).length,
    [allVoucherTemplates],
  )
  const totalRedeemed = useMemo(
    () => allVoucherTemplates.reduce((sum, item) => sum + item.redeemed_count, 0),
    [allVoucherTemplates],
  )

  const hasActiveFilter =
    debouncedQuery.length > 0 ||
    typeFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    tierFilter !== 'ALL'

  const pendingVoucherTemplate = modal
    ? allVoucherTemplates.find((item) => item.id === modal.voucherTemplateId)
    : undefined

  const handleConfirmToggle = () => {
    if (!modal || modal.kind !== 'toggle' || !pendingVoucherTemplate) return

    toggleMutation.mutate(
      { voucherTemplateId: modal.voucherTemplateId, isActive: !pendingVoucherTemplate.is_active },
      {
        onSuccess: (voucherTemplate) => {
          setModal(null)
          showToast(
            voucherTemplate.is_active
              ? `Đã kích hoạt ${voucherTemplate.name}.`
              : `Đã tạm dừng ${voucherTemplate.name}.`,
            'success',
          )
        },
        onError: (mutationError) => {
          showToast(
            getApiErrorMessage(mutationError, 'Không thể thay đổi trạng thái voucher.'),
            'error',
          )
        },
      },
    )
  }

  const handleConfirmDelete = () => {
    if (!modal || modal.kind !== 'delete' || !pendingVoucherTemplate) return

    deleteMutation.mutate(modal.voucherTemplateId, {
      onSuccess: () => {
        setModal(null)
        showToast(`Đã xóa voucher ${pendingVoucherTemplate.name}.`, 'success')
      },
      onError: (mutationError) => {
        showToast(
          getApiErrorMessage(
            mutationError,
            'Không thể xóa voucher — có thể đã có lịch sử đổi điểm.',
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
        <PageHeader title="Voucher đổi điểm" description="Quản lý voucher đổi bằng điểm tích lũy." />
        <EmptyState
          icon={Coins}
          title="Không thể tải danh sách voucher đổi điểm"
          description={getApiErrorMessage(error, 'Vui lòng thử lại sau.')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Voucher đổi điểm"
        description="Quản lý voucher khách hàng dùng điểm tích lũy để đổi và áp dụng khi đặt lịch."
        action={
          <Link to="/admin/voucher-templates/new">
            <Button>
              <Plus className="h-4 w-4" />
              Thêm voucher đổi điểm
            </Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng voucher" value={total} icon={Coins} accent="brand" />
        <StatCard
          label="Đang chạy"
          value={activeCount}
          icon={Sparkles}
          accent="emerald"
        />
        <StatCard
          label="Lượt đã đổi"
          value={totalRedeemed}
          icon={Coins}
          accent="amber"
        />
      </div>

      <div className="mb-6 space-y-4">
        <CustomerSearchPanel
          query={query}
          onChange={setQuery}
          onReset={() => setQuery('')}
          label="Tìm voucher đổi điểm"
          placeholder="Tên hoặc mô tả voucher..."
          inputId="voucher-template-search"
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="carivo-panel p-4">
            <Label htmlFor="voucher-template-type-filter" className="mb-1.5">
              Loại voucher
            </Label>
            <Select
              id="voucher-template-type-filter"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as VoucherType | 'ALL')
              }
            >
              <option value="ALL">Tất cả</option>
              {VOUCHER_TEMPLATE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {VOUCHER_TEMPLATE_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </div>
          <div className="carivo-panel p-4">
            <Label htmlFor="voucher-template-status-filter" className="mb-1.5">
              Trạng thái
            </Label>
            <Select
              id="voucher-template-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as AdminVoucherTemplateStatusFilter)
              }
            >
              <option value="ALL">Tất cả</option>
              <option value="ACTIVE">Đang chạy</option>
              <option value="INACTIVE">Tạm dừng</option>
            </Select>
          </div>
          <div className="carivo-panel p-4">
            <Label htmlFor="voucher-template-tier-filter" className="mb-1.5">
              Hạng áp dụng
            </Label>
            <Select
              id="voucher-template-tier-filter"
              value={tierFilter}
              onChange={(event) =>
                setTierFilter(event.target.value as LoyaltyTier | 'ALL')
              }
            >
              <option value="ALL">Tất cả</option>
              {(loyaltyTiersQuery.data ?? [])
                .filter((tier) => tier.is_active)
                .map((tier) => (
                  <option key={tier.id} value={tier.tier}>
                    {getTierLabel(tier.tier)}
                  </option>
                ))}
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {voucherTemplates.length} voucher đổi điểm
            {hasActiveFilter ? ' (đã lọc)' : ''}
            {meta ? ` · Trang ${meta.page}/${meta.total_pages}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <AdminVoucherTemplateListTable
            voucherTemplates={voucherTemplates}
            hasActiveFilter={hasActiveFilter}
            onToggleActive={(voucherTemplateId) => setModal({ kind: 'toggle', voucherTemplateId })}
            onDelete={(voucherTemplateId) => setModal({ kind: 'delete', voucherTemplateId })}
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
        open={Boolean(modal && pendingVoucherTemplate)}
        onClose={() => !deleteMutation.isPending && !toggleMutation.isPending && setModal(null)}
        title={
          modal?.kind === 'delete'
            ? 'Xóa voucher đổi điểm?'
            : pendingVoucherTemplate?.is_active
              ? 'Tạm dừng voucher?'
              : 'Kích hoạt voucher?'
        }
        description={pendingVoucherTemplate ? pendingVoucherTemplate.name : undefined}
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
              variant={pendingVoucherTemplate?.is_active ? 'danger' : 'primary'}
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
