import { useState } from 'react'
import { Crown, Plus, Sparkles } from 'lucide-react'
import { getApiErrorMessage, getApiStatusCode } from '../../../api/client'
import { AdminTierRuleCard } from '../../../components/admin/loyalty/AdminTierRuleCard'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Modal } from '../../../components/ui/Modal'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { getTierLabel } from '../../../constants/loyaltyTier'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminTierRules,
  useCreateAdminTierRule,
  useToggleAdminTierRuleStatus,
  useUpdateAdminTierRule,
} from '../../../hooks/api/admin/useAdminTierRules'
import type {
  AdminTierRuleFormValues,
  CreateAdminTierRuleFormValues,
} from '../../../lib/validations/adminTierRule'
import { AdminCreateTierRuleForm } from '../../../components/admin/loyalty/AdminCreateTierRuleForm'
import { AdminTierRuleForm } from '../../../components/admin/loyalty/AdminTierRuleForm'

export function AdminTierRulesPage() {
  const { showToast } = useToast()
  const [submittingRuleId, setSubmittingRuleId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editRuleId, setEditRuleId] = useState<string | null>(null)
  const [confirmRuleId, setConfirmRuleId] = useState<string | null>(null)

  const { data: rules = [], isLoading, isError, error, refetch } = useAdminTierRules()
  const updateMutation = useUpdateAdminTierRule()
  const createMutation = useCreateAdminTierRule()
  const toggleMutation = useToggleAdminTierRuleStatus()

  const activeCount = rules.filter((rule) => rule.is_active).length
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null)
  const pendingDelete = deleteRuleId ? rules.find((rule) => rule.id === deleteRuleId) : undefined
  const editingRule = editRuleId ? rules.find((rule) => rule.id === editRuleId) : undefined
  const pendingRule = confirmRuleId
    ? rules.find((rule) => rule.id === confirmRuleId)
    : undefined

  const handleSave = async (ruleId: string, values: AdminTierRuleFormValues) => {
    setSubmittingRuleId(ruleId)
    try {
      const rule = await updateMutation.mutateAsync({ ruleId, values })
      await refetch()
      setEditRuleId(null)
      showToast(`Đã cập nhật quy tắc ${getTierLabel(rule.tier)}.`, 'success')
    } catch (mutationError) {
      showToast(getApiErrorMessage(mutationError, 'Không thể cập nhật quy tắc hạng.'), 'error')
    } finally {
      setSubmittingRuleId(null)
    }
  }

  const handleToggleActive = () => {
    if (!confirmRuleId || !pendingRule) return

    toggleMutation.mutate(
      { ruleId: confirmRuleId, isActive: !pendingRule.is_active },
      {
        onSuccess: (rule) => {
          showToast(
            rule.is_active
              ? `Đã kích hoạt hạng ${getTierLabel(rule.tier)}.`
              : `Đã tạm ngưng hạng ${getTierLabel(rule.tier)}.`,
            'success',
          )
          setConfirmRuleId(null)
        },
        onError: (mutationError) => {
          showToast(
            getApiErrorMessage(mutationError, 'Không thể thay đổi trạng thái quy tắc.'),
            'error',
          )
        },
      },
    )
  }

  const handleDeactivate = () => {
    if (!deleteRuleId || !pendingDelete) return

    toggleMutation.mutate(
      { ruleId: deleteRuleId, isActive: false },
      {
        onSuccess: async (rule) => {
          await refetch()
          setDeleteRuleId(null)
          setDeleteErrorMessage(null)
          showToast(`Tier ${getTierLabel(rule.tier)} is now inactive.`, 'success')
        },
        onError: (mutationError) => {
          if (getApiStatusCode(mutationError) === 409) {
            setDeleteErrorMessage(
              `${getApiErrorMessage(mutationError, 'The loyalty tier cannot be deactivated.')} ` +
              'This tier is in use by customers or promotions and cannot be deleted.',
            )
            return
          }

          showToast(
            getApiErrorMessage(mutationError, 'Unable to deactivate tier.'),
            'error',
          )
        },
      },
    )
  }

  const handleCreate = async (values: CreateAdminTierRuleFormValues) => {
    try {
      await createMutation.mutateAsync({
        tier_name: values.tier_name,
        booking_window_days: values.booking_window_days,
        max_upcoming_bookings: values.max_upcoming_bookings,
        point_multiplier: values.point_multiplier,
        priority_level: values.priority_level,
        min_total_spent: values.min_total_spent,
        min_total_visits: values.min_total_visits,
        min_total_points: values.min_total_points,
        is_active: values.is_active,
      })
      await refetch()
      setIsCreateModalOpen(false)
      showToast('Tier created successfully.', 'success')
    } catch (mutationError) {
      showToast(getApiErrorMessage(mutationError, 'Unable to create tier.'), 'error')
    }
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
        <PageHeader title="Quy tắc hạng thành viên" description="Cấu hình quy tắc hạng thành viên." />
        <EmptyState
          icon={Crown}
          title="Không thể tải quy tắc hạng"
          description={getApiErrorMessage(error, 'Vui lòng thử lại sau.')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Loyalty Tier Management"
        description="Quản lý ngưỡng, quyền lợi và trạng thái của toàn bộ loyalty tier."
        action={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Tier
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng hạng" value={rules.length} icon={Crown} accent="brand" />
        <StatCard
          label="Đang áp dụng"
          value={activeCount}
          icon={Sparkles}
          accent="emerald"
        />
        <StatCard
          label="Tạm ngưng"
          value={rules.length - activeCount}
          icon={Crown}
          accent="violet"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Lưu ý cấu hình</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          Ngưỡng, hệ số điểm và mức ưu tiên được đồng bộ với hệ thống loyalty. Thứ tự hiển thị
          lấy từ mức ưu tiên do backend cung cấp.
        </CardContent>
      </Card>

      {rules.length === 0 ? (
        <EmptyState
          icon={Crown}
          title="Chưa có quy tắc hạng"
          description="Backend chưa cấu hình quy tắc loyalty nào."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {rules.map((rule) => (
            <AdminTierRuleCard
              key={rule.id}
              rule={rule}
              onSave={handleSave}
              onToggleActive={setConfirmRuleId}
              onDelete={setDeleteRuleId}
              onEdit={() => setEditRuleId(rule.id)}
              isSubmitting={submittingRuleId === rule.id}
            />
          ))}
        </div>
      )}

      <Modal
        open={confirmRuleId !== null}
        onClose={() => setConfirmRuleId(null)}
        title={
          pendingRule?.is_active ? 'Tạm ngưng quy tắc hạng?' : 'Kích hoạt quy tắc hạng?'
        }
        description={
          pendingRule
            ? `Hạng ${getTierLabel(pendingRule.tier)} sẽ ${pendingRule.is_active ? 'không còn áp dụng' : 'được áp dụng lại'
            } trong hệ thống.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmRuleId(null)}>
            Hủy
          </Button>
          <Button
            variant={pendingRule?.is_active ? 'danger' : 'primary'}
            onClick={handleToggleActive}
            disabled={toggleMutation.isPending}
          >
            Xác nhận
          </Button>
        </div>
      </Modal>

      <Modal
        open={isCreateModalOpen}
        onClose={() => {
          if (!createMutation.isPending) setIsCreateModalOpen(false)
        }}
        title="Create Loyalty Tier"
        description="Configure the new loyalty tier and its eligibility thresholds."
        className="max-w-2xl"
      >
        <AdminCreateTierRuleForm
          onSubmit={handleCreate}
          isSubmitting={createMutation.isPending}
        />
      </Modal>

      <Modal open={Boolean(editRuleId && editingRule)} onClose={() => { if (!updateMutation.isPending) setEditRuleId(null) }} title={`Edit ${editingRule?.tier ?? 'tier'}`} description="Update all loyalty tier rule fields." className="max-w-2xl">
        {editingRule ? <AdminTierRuleForm rule={editingRule} onSubmit={(values) => handleSave(editingRule.id, values)} isSubmitting={updateMutation.isPending} /> : null}
      </Modal>

      <Modal
        open={Boolean(deleteRuleId && pendingDelete)}
        onClose={() => {
          if (!toggleMutation.isPending) {
            setDeleteRuleId(null)
            setDeleteErrorMessage(null)
          }
        }}
        title="Are you sure you want to delete this loyalty tier?"
        description="Loyalty tiers cannot be deleted. The tier will be deactivated instead, if the Backend permits it."
      >
        {deleteErrorMessage ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p>{deleteErrorMessage}</p>
            <p className="mt-2 font-medium">
              The tier is in use and cannot be deleted or deactivated.
            </p>
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteRuleId(null)
              setDeleteErrorMessage(null)
            }}
            disabled={toggleMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={toggleMutation.isPending}
            onClick={handleDeactivate}
          >
            {toggleMutation.isPending ? 'Deactivating...' : 'Delete / Deactivate'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
