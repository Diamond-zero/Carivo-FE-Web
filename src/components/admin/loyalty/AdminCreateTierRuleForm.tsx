import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import {
    adminTierRuleFormSchema,
    type AdminTierRuleFormValues,
    LOYALTY_TIER_OPTIONS,
} from '../../../lib/validations/adminTierRule'
import type { AdminTierRule } from '../../../types/admin'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'

interface Props { rule?: AdminTierRule; onSubmit: (values: AdminTierRuleFormValues) => Promise<void>; isSubmitting?: boolean; submitLabel?: string }
export function AdminTierRuleForm({ rule, onSubmit, isSubmitting = false, submitLabel = 'Save tier' }: Props) {
    const { register, handleSubmit, formState: { errors } } = useForm<AdminTierRuleFormValues>({ resolver: zodResolver(adminTierRuleFormSchema), defaultValues: { tier_name: rule?.tier as AdminTierRuleFormValues['tier_name'] | undefined, min_total_points: rule?.min_total_points ?? 0, min_total_spent: rule?.min_total_spent ?? 0, min_total_visits: rule?.min_total_visits ?? 0, booking_window_days: rule?.booking_window_days ?? 1, max_upcoming_bookings: rule?.max_upcoming_bookings ?? 1, point_multiplier: rule?.points_multiplier ?? 1, priority_level: rule?.priority_level ?? 1, is_active: rule?.is_active ?? true } })
    const field = (name: keyof AdminTierRuleFormValues, label: string, type = 'number', min?: number, step: number | 'any' = 'any') => <div><Label htmlFor={`${rule?.id ?? 'new'}-${name}`}>{label}</Label><Input id={`${rule?.id ?? 'new'}-${name}`} type={type} min={min} step={step} error={errors[name]?.message as string | undefined} {...register(name, type === 'number' ? { valueAsNumber: true } : undefined)} /></div>
    return <form onSubmit={handleSubmit(onSubmit)} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Label htmlFor={`${rule?.id ?? 'new'}-tier_name`}>Tier name</Label><select id={`${rule?.id ?? 'new'}-tier_name`} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" aria-invalid={Boolean(errors.tier_name)} {...register('tier_name')}><option value="">Chọn hạng</option>{LOYALTY_TIER_OPTIONS.map((tier) => <option key={tier} value={tier}>{tier}</option>)}</select>{errors.tier_name ? <p className="mt-1 text-sm text-red-600">{errors.tier_name.message}</p> : null}</div>{field('priority_level', 'Priority level', 'number', 1, 1)}{field('min_total_points', 'Minimum total points', 'number', 0, 1)}{field('min_total_spent', 'Minimum total spent', 'number', 0)}{field('min_total_visits', 'Minimum total visits', 'number', 0, 1)}{field('point_multiplier', 'Point multiplier', 'number', 0)}{field('booking_window_days', 'Booking window days', 'number', 1, 1)}{field('max_upcoming_bookings', 'Max upcoming bookings', 'number', 1, 1)}</div><label className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3"><input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" {...register('is_active')} /><span className="text-sm font-medium text-slate-700">Active tier (is_active)</span></label><div className="flex justify-end border-t border-slate-100 pt-4"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : submitLabel}</Button></div></form>
}
export const AdminCreateTierRuleForm = AdminTierRuleForm
export const AdminEditTierRuleForm = AdminTierRuleForm
