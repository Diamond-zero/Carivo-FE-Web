import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import {
  adminTierRuleFormSchema,
  type AdminTierRuleFormValues,
} from '../../../lib/validations/adminTierRule'
import type { AdminTierRule } from '../../../types/admin'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'

interface AdminTierRuleFormProps {
  rule: AdminTierRule
  onSubmit: (values: AdminTierRuleFormValues) => Promise<void>
  isSubmitting?: boolean
}

export function AdminTierRuleForm({
  rule,
  onSubmit,
  isSubmitting = false,
}: AdminTierRuleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminTierRuleFormValues>({
    resolver: zodResolver(adminTierRuleFormSchema),
    defaultValues: {
      min_total_spent: rule.min_total_spent,
      min_total_visits: rule.min_total_visits,
      booking_window_days: rule.booking_window_days,
      max_upcoming_bookings: rule.max_upcoming_bookings,
      points_multiplier: rule.points_multiplier,
      priority_level: rule.priority_level,
      is_active: rule.is_active,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${rule.id}-spent`}>Tổng chi tiêu tối thiểu (VND)</Label>
          <Input
            id={`${rule.id}-spent`}
            type="number"
            min={0}
            step={10000}
            error={errors.min_total_spent?.message}
            {...register('min_total_spent', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label htmlFor={`${rule.id}-visits`}>Số lượt ghé tối thiểu</Label>
          <Input
            id={`${rule.id}-visits`}
            type="number"
            min={0}
            step={1}
            error={errors.min_total_visits?.message}
            {...register('min_total_visits', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label htmlFor={`${rule.id}-window`}>Cửa sổ đặt lịch (ngày)</Label>
          <Input
            id={`${rule.id}-window`}
            type="number"
            min={1}
            max={60}
            error={errors.booking_window_days?.message}
            {...register('booking_window_days', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label htmlFor={`${rule.id}-upcoming`}>Số booking sắp tới tối đa</Label>
          <Input
            id={`${rule.id}-upcoming`}
            type="number"
            min={1}
            max={10}
            error={errors.max_upcoming_bookings?.message}
            {...register('max_upcoming_bookings', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label htmlFor={`${rule.id}-multiplier`}>Hệ số điểm</Label>
          <Input
            id={`${rule.id}-multiplier`}
            type="number"
            min={1}
            max={3}
            step={0.05}
            error={errors.points_multiplier?.message}
            {...register('points_multiplier', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label htmlFor={`${rule.id}-priority`}>Mức ưu tiên</Label>
          <Input
            id={`${rule.id}-priority`}
            type="number"
            min={1}
            max={10}
            error={errors.priority_level?.message}
            {...register('priority_level', { valueAsNumber: true })}
          />
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-brand-600"
          {...register('is_active')}
        />
        <span className="text-sm font-medium text-slate-700">Đang áp dụng (is_active)</span>
      </label>

      <div className="flex justify-end border-t border-slate-100 pt-3">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            'Lưu quy tắc'
          )}
        </Button>
      </div>
    </form>
  )
}
