import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { DISCOUNT_TYPE_LABELS, DISCOUNT_TYPES } from '../../../constants/promotion'
import { LOYALTY_TIER_LABELS } from '../../../constants/loyaltyTier'
import {
  adminPromotionFormSchema,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  type AdminPromotionFormValues,
} from '../../../lib/validations/adminPromotion'
import type { LoyaltyTier } from '../../../types/loyalty'
import type { Promotion } from '../../../types/promotion'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Select } from '../../ui/Select'
import { Textarea } from '../../ui/Textarea'

const loyaltyTiers: LoyaltyTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']

interface AdminPromotionFormProps {
  mode: 'create' | 'edit'
  initialPromotion?: Promotion
  onSubmit: (values: AdminPromotionFormValues) => Promise<void>
  isSubmitting?: boolean
}

export function AdminPromotionForm({
  mode,
  initialPromotion,
  onSubmit,
  isSubmitting = false,
}: AdminPromotionFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdminPromotionFormValues>({
    resolver: zodResolver(adminPromotionFormSchema),
    defaultValues: {
      code: initialPromotion?.code ?? '',
      name: initialPromotion?.name ?? '',
      description: initialPromotion?.description ?? '',
      discount_type: initialPromotion?.discount_type ?? 'PERCENTAGE',
      discount_value: initialPromotion?.discount_value ?? 10,
      max_discount_amount: initialPromotion?.max_discount_amount ?? null,
      min_order_amount: initialPromotion?.min_order_amount ?? 100000,
      applicable_tiers: initialPromotion?.applicable_tiers ?? ['BRONZE'],
      usage_limit: initialPromotion?.usage_limit ?? null,
      start_at: initialPromotion
        ? toDatetimeLocalValue(initialPromotion.start_at)
        : '2026-01-01T00:00',
      end_at: initialPromotion
        ? toDatetimeLocalValue(initialPromotion.end_at)
        : '2026-12-31T23:59',
      is_active: initialPromotion?.is_active ?? true,
    },
  })

  const discountType = watch('discount_type')
  const selectedTiers = watch('applicable_tiers')

  const toggleTier = (tier: LoyaltyTier) => {
    const next = selectedTiers.includes(tier)
      ? selectedTiers.filter((item) => item !== tier)
      : [...selectedTiers, tier]
    setValue('applicable_tiers', next, { shouldValidate: true })
  }

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit({
      ...values,
      start_at: fromDatetimeLocalValue(values.start_at),
      end_at: fromDatetimeLocalValue(values.end_at),
      usage_limit: values.usage_limit ?? null,
      max_discount_amount:
        values.discount_type === 'PERCENTAGE'
          ? values.max_discount_amount ?? null
          : null,
    })
  })

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="code">Mã khuyến mãi</Label>
          <Input
            id="code"
            placeholder="CARIVO10"
            className="font-mono uppercase"
            error={errors.code?.message}
            {...register('code')}
          />
        </div>

        <div>
          <Label htmlFor="name">Tên chương trình</Label>
          <Input
            id="name"
            placeholder="Giảm 10% đơn đầu"
            error={errors.name?.message}
            {...register('name')}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            rows={3}
            error={errors.description?.message}
            {...register('description')}
          />
        </div>

        <div>
          <Label htmlFor="discount_type">Loại giảm giá</Label>
          <Select
            id="discount_type"
            error={errors.discount_type?.message}
            {...register('discount_type')}
          >
            {DISCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {DISCOUNT_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="discount_value">
            {discountType === 'PERCENTAGE' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VND)'}
          </Label>
          <Input
            id="discount_value"
            type="number"
            min={1}
            step={discountType === 'PERCENTAGE' ? 1 : 1000}
            error={errors.discount_value?.message}
            {...register('discount_value', { valueAsNumber: true })}
          />
        </div>

        {discountType === 'PERCENTAGE' ? (
          <div>
            <Label htmlFor="max_discount_amount">Trần giảm tối đa (VND)</Label>
            <Input
              id="max_discount_amount"
              type="number"
              min={1000}
              step={1000}
              placeholder="Không giới hạn"
              error={errors.max_discount_amount?.message}
              {...register('max_discount_amount', {
                setValueAs: (value) => (value === '' || value == null ? null : Number(value)),
              })}
            />
          </div>
        ) : null}

        <div>
          <Label htmlFor="min_order_amount">Đơn tối thiểu (VND)</Label>
          <Input
            id="min_order_amount"
            type="number"
            min={0}
            step={1000}
            error={errors.min_order_amount?.message}
            {...register('min_order_amount', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label htmlFor="usage_limit">Giới hạn lượt dùng</Label>
          <Input
            id="usage_limit"
            type="number"
            min={1}
            placeholder="Không giới hạn"
            error={errors.usage_limit?.message}
            {...register('usage_limit', {
              setValueAs: (value) => (value === '' || value == null ? null : Number(value)),
            })}
          />
        </div>

        <div>
          <Label htmlFor="start_at">Bắt đầu</Label>
          <Input
            id="start_at"
            type="datetime-local"
            error={errors.start_at?.message}
            {...register('start_at')}
          />
        </div>

        <div>
          <Label htmlFor="end_at">Kết thúc</Label>
          <Input
            id="end_at"
            type="datetime-local"
            error={errors.end_at?.message}
            {...register('end_at')}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-800">Hạng áp dụng</p>
        {errors.applicable_tiers ? (
          <p className="mb-2 text-sm text-red-600">{errors.applicable_tiers.message}</p>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-2">
          {loyaltyTiers.map((tier) => (
            <label
              key={tier}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/80 bg-white px-3 py-2"
            >
              <input
                type="checkbox"
                checked={selectedTiers.includes(tier)}
                onChange={() => toggleTier(tier)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              <span className="text-sm text-slate-700">{LOYALTY_TIER_LABELS[tier]}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-brand-600"
          {...register('is_active')}
        />
        <span className="text-sm font-medium text-slate-700">Đang hoạt động (is_active)</span>
      </label>

      {mode === 'edit' && initialPromotion ? (
        <p className="text-sm text-slate-500">
          Đã sử dụng: <strong>{initialPromotion.used_count}</strong>
          {initialPromotion.usage_limit != null
            ? ` / ${initialPromotion.usage_limit} lượt`
            : ' lượt (không giới hạn)'}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : mode === 'create' ? (
            'Tạo khuyến mãi'
          ) : (
            'Lưu thay đổi'
          )}
        </Button>
      </div>
    </form>
  )
}
