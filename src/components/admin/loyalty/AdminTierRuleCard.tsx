import { Crown } from 'lucide-react'
import { TierBadge } from '../../customer/TierBadge'
import {
  LOYALTY_TIER_CARD_BG,
  LOYALTY_TIER_LABELS,
} from '../../../constants/loyaltyTier'
import type { AdminTierRule } from '../../../types/admin'
import type { AdminTierRuleFormValues } from '../../../lib/validations/adminTierRule'
import { formatCurrency } from '../../../lib/utils'
import { cn } from '../../../lib/utils'
import { AdminTierRuleForm } from './AdminTierRuleForm'
import { Button } from '../../ui/Button'

interface AdminTierRuleCardProps {
  rule: AdminTierRule
  onSave: (ruleId: string, values: AdminTierRuleFormValues) => Promise<void>
  onToggleActive: (ruleId: string) => void
  isSubmitting?: boolean
}

export function AdminTierRuleCard({
  rule,
  onSave,
  onToggleActive,
  isSubmitting = false,
}: AdminTierRuleCardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm',
      )}
    >
      <div
        className={cn(
          'border-b border-slate-100 bg-gradient-to-r px-5 py-4',
          LOYALTY_TIER_CARD_BG[rule.tier],
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-brand-700 shadow-sm">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <TierBadge tier={rule.tier} />
                <span className="font-mono text-xs text-slate-500">{rule.id}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Hạng {LOYALTY_TIER_LABELS[rule.tier]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                rule.is_active
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700',
              )}
            >
              {rule.is_active ? 'Đang áp dụng' : 'Tạm ngưng'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onToggleActive(rule.id)}
            >
              {rule.is_active ? 'Ngưng' : 'Kích hoạt'}
            </Button>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-slate-500">Chi tiêu tối thiểu</dt>
            <dd className="font-medium text-slate-900">
              {formatCurrency(rule.min_total_spent)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Lượt ghé</dt>
            <dd className="font-medium text-slate-900">{rule.min_total_visits}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Hệ số điểm</dt>
            <dd className="font-medium text-slate-900">x{rule.points_multiplier}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Ưu tiên</dt>
            <dd className="font-medium text-slate-900">{rule.priority_level}</dd>
          </div>
        </dl>
      </div>

      <div className="p-5">
        <AdminTierRuleForm
          key={`${rule.id}-${rule.min_total_spent}-${rule.is_active}`}
          rule={rule}
          onSubmit={(values) => onSave(rule.id, values)}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
