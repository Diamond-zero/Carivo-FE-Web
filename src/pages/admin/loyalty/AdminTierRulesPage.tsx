import { Crown, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { getApiErrorMessage } from '../../../api/client'
import { AdminTierRuleCard } from '../../../components/admin/loyalty/AdminTierRuleCard'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Modal } from '../../../components/ui/Modal'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { LOYALTY_TIER_LABELS } from '../../../constants/loyaltyTier'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminTierRules,
  useToggleAdminTierRuleStatus,
  useUpdateAdminTierRule,
} from '../../../hooks/api/admin/useAdminTierRules'
import type { AdminTierRuleFormValues } from '../../../lib/validations/adminTierRule'

export function AdminTierRulesPage() {
  const { showToast } = useToast()
  const [submittingRuleId, setSubmittingRuleId] = useState<string | null>(null)
  const [confirmRuleId, setConfirmRuleId] = useState<string | null>(null)

  const { data: rules = [], isLoading, isError, error } = useAdminTierRules()
  const updateMutation = useUpdateAdminTierRule()
  const toggleMutation = useToggleAdminTierRuleStatus()

  const activeCount = rules.filter((rule) => rule.is_active).length
  const pendingRule = confirmRuleId
    ? rules.find((rule) => rule.id === confirmRuleId)
    : undefined

  const handleSave = async (ruleId: string, values: AdminTierRuleFormValues) => {
    setSubmittingRuleId(ruleId)
    updateMutation.mutate(
      { ruleId, values },
      {
        onSuccess: (rule) => {
          showToast(
            `Đã cập nhật quy tắc ${LOYALTY_TIER_LABELS[rule.tier]}.`,
            'success',
          )
        },
        onError: (mutationError) => {
          showToast(
            getApiErrorMessage(mutationError, 'Không thể cập nhật quy tắc hạng.'),
            'error',
          )
        },
        onSettled: () => {
          setSubmittingRuleId(null)
        },
      },
    )
  }

  const handleToggleActive = () => {
    if (!confirmRuleId || !pendingRule) return

    toggleMutation.mutate(
      { ruleId: confirmRuleId, isActive: !pendingRule.is_active },
      {
        onSuccess: (rule) => {
          showToast(
            rule.is_active
              ? `Đã kích hoạt hạng ${LOYALTY_TIER_LABELS[rule.tier]}.`
              : `Đã tạm ngưng hạng ${LOYALTY_TIER_LABELS[rule.tier]}.`,
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
        title="Quy tắc hạng thành viên"
        description="Cấu hình ngưỡng nâng hạng, quyền lợi đặt lịch và hệ số tích điểm cho 4 hạng thành viên."
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
          Ngưỡng chi tiêu, lượt ghé, hệ số điểm và mức ưu tiên phải tăng dần theo thứ tự Đồng →
          Bạc → Vàng → Bạch kim. Thay đổi được đồng bộ với hệ thống loyalty.
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {rules.map((rule) => (
          <AdminTierRuleCard
            key={rule.id}
            rule={rule}
            onSave={handleSave}
            onToggleActive={setConfirmRuleId}
            isSubmitting={submittingRuleId === rule.id}
          />
        ))}
      </div>

      <Modal
        open={confirmRuleId !== null}
        onClose={() => setConfirmRuleId(null)}
        title={
          pendingRule?.is_active ? 'Tạm ngưng quy tắc hạng?' : 'Kích hoạt quy tắc hạng?'
        }
        description={
          pendingRule
            ? `Hạng ${LOYALTY_TIER_LABELS[pendingRule.tier]} sẽ ${
                pendingRule.is_active ? 'không còn áp dụng' : 'được áp dụng lại'
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
    </div>
  )
}
