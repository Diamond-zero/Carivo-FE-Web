import { Crown, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AdminTierRuleCard } from '../../../components/admin/loyalty/AdminTierRuleCard'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Modal } from '../../../components/ui/Modal'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { LOYALTY_TIER_LABELS } from '../../../constants/loyaltyTier'
import { useToast } from '../../../contexts/ToastContext'
import { useInitialPageSkeleton } from '../../../hooks/useInitialPageSkeleton'
import type { AdminTierRuleFormValues } from '../../../lib/validations/adminTierRule'
import {
  getAdminTierRulesFromStore,
  toggleAdminTierRuleActive,
  updateAdminTierRule,
} from '../../../mocks/admin/adminTierRuleStore'
import { Button } from '../../../components/ui/Button'

export function AdminTierRulesPage() {
  const { showToast } = useToast()
  const isLoading = useInitialPageSkeleton(260)
  const [refreshKey, setRefreshKey] = useState(0)
  const [submittingRuleId, setSubmittingRuleId] = useState<string | null>(null)
  const [confirmRuleId, setConfirmRuleId] = useState<string | null>(null)

  const rules = useMemo(() => getAdminTierRulesFromStore(), [refreshKey])
  const activeCount = rules.filter((rule) => rule.is_active).length
  const pendingRule = confirmRuleId
    ? rules.find((rule) => rule.id === confirmRuleId)
    : undefined

  const bumpRefresh = () => setRefreshKey((value) => value + 1)

  const handleSave = async (ruleId: string, values: AdminTierRuleFormValues) => {
    setSubmittingRuleId(ruleId)
    try {
      const result = updateAdminTierRule(ruleId, values)
      if (!result.ok) {
        showToast(result.message, 'error')
        return
      }

      bumpRefresh()
      showToast(
        `Đã cập nhật quy tắc ${LOYALTY_TIER_LABELS[result.rule.tier]}.`,
        'success',
      )
    } finally {
      setSubmittingRuleId(null)
    }
  }

  const handleToggleActive = () => {
    if (!confirmRuleId) return

    const result = toggleAdminTierRuleActive(confirmRuleId)
    if (!result.ok) {
      showToast(result.message, 'error')
      return
    }

    bumpRefresh()
    showToast(
      result.rule.is_active
        ? `Đã kích hoạt hạng ${LOYALTY_TIER_LABELS[result.rule.tier]}.`
        : `Đã tạm ngưng hạng ${LOYALTY_TIER_LABELS[result.rule.tier]}.`,
      'success',
    )
    setConfirmRuleId(null)
  }

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Admin"
            title="Loyalty — Tier Rules"
            description="Cấu hình ngưỡng nâng hạng, quyền lợi đặt lịch và hệ số tích điểm cho 4 hạng thành viên."
          />

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Tổng hạng"
              value={rules.length}
              icon={Crown}
              accent="brand"
            />
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
              Ngưỡng chi tiêu, lượt ghé, hệ số điểm và mức ưu tiên phải tăng dần theo thứ
              tự Đồng → Bạc → Vàng → Bạch kim. Thay đổi chỉ lưu trong mock Admin, chưa đồng
              bộ Staff.
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            {rules.map((rule) => (
              <AdminTierRuleCard
                key={`${rule.id}-${refreshKey}`}
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
              pendingRule?.is_active
                ? 'Tạm ngưng quy tắc hạng?'
                : 'Kích hoạt quy tắc hạng?'
            }
            description={
              pendingRule
                ? `Hạng ${LOYALTY_TIER_LABELS[pendingRule.tier]} sẽ ${
                    pendingRule.is_active ? 'không còn áp dụng' : 'được áp dụng lại'
                  } trong cấu hình mock.`
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
