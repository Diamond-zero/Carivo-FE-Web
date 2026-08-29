import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { VOUCHER_TEMPLATE_TYPE_LABELS, VOUCHER_TEMPLATE_TYPES } from '../../../constants/voucherTemplate'
import { useAdminServicePackages } from '../../../hooks/api/admin/useAdminServicePackages'
import { useAdminTierRules } from '../../../hooks/api/admin/useAdminTierRules'
import {
  adminVoucherTemplateFormSchema,
  fromDatetimeLocalToApiIso,
  toDatetimeLocalValue,
  toLocalDatetimeLocalValue,
  VOUCHER_TEMPLATE_FORM_LIMITS,
  type AdminVoucherTemplateFormValues,
} from '../../../lib/validations/adminVoucherTemplate'
import type { VoucherTemplate } from '../../../types/voucherTemplate'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Select } from '../../ui/Select'
import { Textarea } from '../../ui/Textarea'

interface AdminVoucherTemplateFormProps {
  mode: 'create' | 'edit'
  initialVoucherTemplate?: VoucherTemplate
  onSubmit: (values: AdminVoucherTemplateFormValues) => Promise<void>
  isSubmitting?: boolean
}

function getDefaultValue(
  voucherTemplate: VoucherTemplate | undefined,
  voucherType: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'FREE_SERVICE',
): number {
  if (voucherType === 'FREE_SERVICE') return 0
  if (voucherTemplate?.value != null && voucherTemplate.voucher_type === voucherType) {
    return voucherTemplate.value
  }
  return voucherType === 'PERCENTAGE'
    ? VOUCHER_TEMPLATE_FORM_LIMITS.PERCENTAGE_MIN
    : VOUCHER_TEMPLATE_FORM_LIMITS.FIXED_AMOUNT_MIN
}

export function AdminVoucherTemplateForm({
  mode,
  initialVoucherTemplate,
  onSubmit,
  isSubmitting = false,
}: AdminVoucherTemplateFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdminVoucherTemplateFormValues>({
    resolver: zodResolver(adminVoucherTemplateFormSchema),
    defaultValues: {
      name: initialVoucherTemplate?.name ?? '',
      description: initialVoucherTemplate?.description ?? '',
      voucher_type: initialVoucherTemplate?.voucher_type ?? 'FIXED_AMOUNT',
      value: getDefaultValue(
        initialVoucherTemplate,
        initialVoucherTemplate?.voucher_type ?? 'FIXED_AMOUNT',
      ),
      max_discount_amount: initialVoucherTemplate?.max_discount_amount ?? null,
      min_order_amount: initialVoucherTemplate?.min_order_amount ?? 0,
      service_package_id: initialVoucherTemplate?.service_package_id ?? null,
      points_cost: initialVoucherTemplate?.points_cost ?? 100,
      voucher_validity_days: initialVoucherTemplate?.voucher_validity_days ?? 30,
      total_quantity: initialVoucherTemplate?.total_quantity ?? null,
      per_customer_limit: initialVoucherTemplate?.per_customer_limit ?? null,
      applicable_tiers: initialVoucherTemplate?.applicable_tiers ?? [],
      start_at: initialVoucherTemplate
        ? toDatetimeLocalValue(initialVoucherTemplate.start_at)
        : toLocalDatetimeLocalValue(new Date()),
      end_at: initialVoucherTemplate
        ? toDatetimeLocalValue(initialVoucherTemplate.end_at)
        : toLocalDatetimeLocalValue(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
      is_active: initialVoucherTemplate?.is_active ?? true,
    },
  })

  const { allPackages } = useAdminServicePackages({})
  const loyaltyTiersQuery = useAdminTierRules()

  const voucherType = watch('voucher_type')
  const selectedTiers = watch('applicable_tiers')
  const isPercentage = voucherType === 'PERCENTAGE'
  const isFreeService = voucherType === 'FREE_SERVICE'

  const loyaltyTiers = useMemo(() => {
    const selected = new Set(selectedTiers)
    return (loyaltyTiersQuery.data ?? []).filter(
      (tier) => tier.is_active || selected.has(tier.tier),
    )
  }, [loyaltyTiersQuery.data, selectedTiers])

  const packageOptions = useMemo(() => {
    const selectable = allPackages.filter(
      (pkg) => pkg.is_active !== false && pkg.service_type !== 'ADDON',
    )
    const currentId = initialVoucherTemplate?.service_package_id
    if (!currentId || selectable.some((pkg) => pkg.id === currentId)) {
      return selectable
    }

    const current = allPackages.find((pkg) => pkg.id === currentId)
    return current ? [current, ...selectable] : selectable
  }, [allPackages, initialVoucherTemplate?.service_package_id])

  useEffect(() => {
    if (isFreeService) {
      setValue('value', 0, { shouldValidate: true })
      return
    }

    const current = watch('value')
    if (isPercentage) {
      if (
        current < VOUCHER_TEMPLATE_FORM_LIMITS.PERCENTAGE_MIN ||
        current > VOUCHER_TEMPLATE_FORM_LIMITS.PERCENTAGE_MAX
      ) {
        setValue(
          'value',
          initialVoucherTemplate?.voucher_type === 'PERCENTAGE'
            ? initialVoucherTemplate.value
            : VOUCHER_TEMPLATE_FORM_LIMITS.PERCENTAGE_MIN,
          { shouldValidate: true },
        )
      }
    } else if (
      current < VOUCHER_TEMPLATE_FORM_LIMITS.FIXED_AMOUNT_MIN ||
      current > VOUCHER_TEMPLATE_FORM_LIMITS.FIXED_AMOUNT_MAX
    ) {
      setValue(
        'value',
        initialVoucherTemplate?.voucher_type === 'FIXED_AMOUNT'
          ? initialVoucherTemplate.value
          : VOUCHER_TEMPLATE_FORM_LIMITS.FIXED_AMOUNT_MIN,
        { shouldValidate: true },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voucherType, isPercentage, isFreeService, setValue, initialVoucherTemplate])

  const toggleTier = (tier: string) => {
    const next = selectedTiers.includes(tier)
      ? selectedTiers.filter((item) => item !== tier)
      : [...selectedTiers, tier]
    setValue('applicable_tiers', next, { shouldValidate: true })
  }

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit({
      ...values,
      start_at: fromDatetimeLocalToApiIso(values.start_at),
      end_at: fromDatetimeLocalToApiIso(values.end_at),
      total_quantity: values.total_quantity ?? null,
      per_customer_limit: values.per_customer_limit ?? null,
      service_package_id: values.voucher_type === 'FREE_SERVICE' ? values.service_package_id : null,
      max_discount_amount:
        values.voucher_type === 'PERCENTAGE'
          ? values.max_discount_amount ?? null
          : null,
    })
  })

  const valueMin = isPercentage
    ? VOUCHER_TEMPLATE_FORM_LIMITS.PERCENTAGE_MIN
    : VOUCHER_TEMPLATE_FORM_LIMITS.FIXED_AMOUNT_MIN
  const valueMax = isPercentage
    ? VOUCHER_TEMPLATE_FORM_LIMITS.PERCENTAGE_MAX
    : VOUCHER_TEMPLATE_FORM_LIMITS.FIXED_AMOUNT_MAX
  const valueHtmlStep = isPercentage ? 1 : 'any'
  const valueHint = isPercentage
    ? `Từ ${VOUCHER_TEMPLATE_FORM_LIMITS.PERCENTAGE_MIN}% đến ${VOUCHER_TEMPLATE_FORM_LIMITS.PERCENTAGE_MAX}%.`
    : `Từ ${VOUCHER_TEMPLATE_FORM_LIMITS.FIXED_AMOUNT_MIN.toLocaleString('vi-VN')} đến ${VOUCHER_TEMPLATE_FORM_LIMITS.FIXED_AMOUNT_MAX.toLocaleString('vi-VN')} VND.`

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Tên voucher đổi điểm</Label>
          <Input
            id="name"
            placeholder="Voucher giảm 50K cho khách Vàng"
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
          <Label htmlFor="voucher_type">Loại voucher</Label>
          <Select
            id="voucher_type"
            error={errors.voucher_type?.message}
            {...register('voucher_type')}
          >
            {VOUCHER_TEMPLATE_TYPES.map((type) => (
              <option key={type} value={type}>
                {VOUCHER_TEMPLATE_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="points_cost">Số điểm cần đổi</Label>
          <Input
            id="points_cost"
            type="number"
            min={VOUCHER_TEMPLATE_FORM_LIMITS.POINTS_COST_MIN}
            step={1}
            error={errors.points_cost?.message}
            {...register('points_cost', { valueAsNumber: true })}
          />
        </div>

        {!isFreeService ? (
          <div>
            <Label htmlFor="value">
              {isPercentage ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VND)'}
            </Label>
            <Input
              id="value"
              type="number"
              min={valueMin}
              max={valueMax}
              step={valueHtmlStep}
              error={errors.value?.message}
              {...register('value', { valueAsNumber: true })}
            />
            <p className="mt-1 text-xs text-slate-500">{valueHint}</p>
          </div>
        ) : (
          <div>
            <Label htmlFor="service_package_id" required>
              Gói dịch vụ được tặng
            </Label>
            <Select
              id="service_package_id"
              error={errors.service_package_id?.message}
              value={watch('service_package_id') ?? ''}
              onChange={(event) =>
                setValue('service_package_id', event.target.value || null, {
                  shouldValidate: true,
                })
              }
            >
              <option value="">Chọn gói dịch vụ</option>
              {packageOptions.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} · {pkg.vehicle_type}
                </option>
              ))}
            </Select>
          </div>
        )}

        {isPercentage ? (
          <div>
            <Label htmlFor="max_discount_amount">Giảm tối đa (VND)</Label>
            <Input
              id="max_discount_amount"
              type="number"
              min={VOUCHER_TEMPLATE_FORM_LIMITS.FIXED_AMOUNT_MIN}
              step="any"
              placeholder="Không giới hạn"
              error={errors.max_discount_amount?.message}
              {...register('max_discount_amount', {
                setValueAs: (value) =>
                  value === '' || value == null ? null : Number(value),
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
            step="any"
            error={errors.min_order_amount?.message}
            {...register('min_order_amount', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label htmlFor="voucher_validity_days">Hiệu lực voucher sau khi đổi (ngày)</Label>
          <Input
            id="voucher_validity_days"
            type="number"
            min={VOUCHER_TEMPLATE_FORM_LIMITS.VALIDITY_DAYS_MIN}
            step={1}
            error={errors.voucher_validity_days?.message}
            {...register('voucher_validity_days', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label htmlFor="total_quantity">Tổng số lượng phát hành</Label>
          <Input
            id="total_quantity"
            type="number"
            min={1}
            placeholder="Không giới hạn"
            error={errors.total_quantity?.message}
            {...register('total_quantity', {
              setValueAs: (value) =>
                value === '' || value == null ? null : Number(value),
            })}
          />
        </div>

        <div>
          <Label htmlFor="per_customer_limit">Giới hạn mỗi khách</Label>
          <Input
            id="per_customer_limit"
            type="number"
            min={1}
            placeholder="Không giới hạn"
            error={errors.per_customer_limit?.message}
            {...register('per_customer_limit', {
              setValueAs: (value) =>
                value === '' || value == null ? null : Number(value),
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
        <p className="mb-1 text-sm font-semibold text-slate-800">Hạng áp dụng</p>
        <p className="mb-3 text-xs text-slate-500">
          Để trống = áp dụng cho tất cả hạng loyalty. Chọn một hoặc nhiều hạng.
        </p>
        {loyaltyTiersQuery.isLoading ? (
          <p className="mb-2 text-sm text-slate-500">Đang tải hạng loyalty...</p>
        ) : loyaltyTiersQuery.isError ? (
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm text-red-600">Không thể tải hạng loyalty.</p>
            <button
              type="button"
              onClick={() => void loyaltyTiersQuery.refetch()}
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : null}
        {loyaltyTiers.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {loyaltyTiers.map((tier) => (
              <label
                key={tier.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/80 bg-white px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={selectedTiers.includes(tier.tier)}
                  onChange={() => toggleTier(tier.tier)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                <span className="text-sm text-slate-700">
                  {tier.tier}
                  {tier.is_active ? '' : ' (tạm dừng)'}
                </span>
              </label>
            ))}
          </div>
        ) : null}
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-brand-600"
          {...register('is_active')}
        />
        <span className="text-sm font-medium text-slate-700">
          Cho phép khách đổi điểm trên app
        </span>
      </label>
      <p className="text-xs text-slate-500">
        Voucher đổi điểm dùng được tại mọi garage khi khách đặt lịch. Không
        gắn với một garage cụ thể.
      </p>

      {mode === 'edit' && initialVoucherTemplate ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>
            Đã đổi: <strong>{initialVoucherTemplate.redeemed_count}</strong>
            {initialVoucherTemplate.total_quantity != null
              ? ` / ${initialVoucherTemplate.total_quantity} lượt`
              : ' lượt (không giới hạn)'}
          </p>
        </div>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : mode === 'create' ? (
            'Tạo voucher đổi điểm'
          ) : (
            'Lưu thay đổi'
          )}
        </Button>
      </div>
    </form>
  )
}
