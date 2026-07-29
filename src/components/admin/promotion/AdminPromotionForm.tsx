import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { DISCOUNT_TYPE_LABELS, DISCOUNT_TYPES } from '../../../constants/promotion'
import { LOYALTY_TIER_LABELS } from '../../../constants/loyaltyTier'
import { VEHICLE_TYPE_LABELS } from '../../../constants/washBayStatus'
import { useAdminServicePackages } from '../../../hooks/api/admin/useAdminServicePackages'
import {
  PROMOTION_AUDIENCES,
  PROMOTION_AUDIENCE_LABELS,
} from '../../../hooks/api/admin/useAdminPromotions'
import {
  adminPromotionFormSchema,
  fromDatetimeLocalToApiIso,
  PROMOTION_FORM_LIMITS,
  toDatetimeLocalValue,
  type AdminPromotionFormValues,
} from '../../../lib/validations/adminPromotion'
import type { LoyaltyTier } from '../../../types/loyalty'
import type { Promotion } from '../../../types/promotion'
import type { VehicleType } from '../../../types/washBay'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Select } from '../../ui/Select'
import { Textarea } from '../../ui/Textarea'

const loyaltyTiers: LoyaltyTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']
const vehicleTypes: VehicleType[] = ['MOTORBIKE', 'CAR']

interface AdminPromotionFormProps {
  mode: 'create' | 'edit'
  initialPromotion?: Promotion
  onSubmit: (values: AdminPromotionFormValues) => Promise<void>
  isSubmitting?: boolean
}

function getDefaultDiscountValue(
  promotion: Promotion | undefined,
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT',
): number {
  if (promotion?.discount_value != null && promotion.discount_type === discountType) {
    return promotion.discount_value
  }
  return discountType === 'PERCENTAGE'
    ? PROMOTION_FORM_LIMITS.PERCENTAGE_MIN
    : PROMOTION_FORM_LIMITS.FIXED_AMOUNT_MIN
}

function splitPackagesByVehicleType(
  allPackages: { id: string; name: string; vehicle_type: VehicleType }[],
  selected: VehicleType[],
): { id: string; name: string; vehicle_type: VehicleType }[] {
  if (selected.length === 0) return allPackages
  const allowed = new Set(selected)
  return allPackages.filter((pkg) => allowed.has(pkg.vehicle_type))
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
      discount_value: getDefaultDiscountValue(
        initialPromotion,
        initialPromotion?.discount_type ?? 'PERCENTAGE',
      ),
      max_discount_amount: initialPromotion?.max_discount_amount ?? null,
      min_order_amount: initialPromotion?.min_order_amount ?? 0,
      audience: initialPromotion?.audience ?? 'ALL',
      phone_required: initialPromotion?.phone_required ?? false,
      per_phone_limit: initialPromotion?.per_phone_limit ?? null,
      applicable_tiers: initialPromotion?.applicable_tiers ?? ['BRONZE'],
      applicable_vehicle_types: initialPromotion?.applicable_vehicle_types ?? [],
      applicable_service_package_ids:
        initialPromotion?.applicable_service_package_ids ?? [],
      usage_limit: initialPromotion?.usage_limit ?? null,
      per_customer_limit: initialPromotion?.per_customer_limit ?? null,
      start_at: initialPromotion
        ? toDatetimeLocalValue(initialPromotion.start_at)
        : '2026-01-01T00:00',
      end_at: initialPromotion
        ? toDatetimeLocalValue(initialPromotion.end_at)
        : '2026-12-31T23:59',
      is_active: initialPromotion?.is_active ?? true,
    },
  })

  const { allPackages } = useAdminServicePackages({})

  const discountType = watch('discount_type')
  const selectedTiers = watch('applicable_tiers')
  const selectedVehicleTypes = watch('applicable_vehicle_types')
  const selectedPackageIds = watch('applicable_service_package_ids')
  const isPercentage = discountType === 'PERCENTAGE'

  const packageOptions = useMemo(
    () => splitPackagesByVehicleType(allPackages, selectedVehicleTypes),
    [allPackages, selectedVehicleTypes],
  )

  useEffect(() => {
    const current = watch('discount_value')
    if (isPercentage) {
      if (
        current < PROMOTION_FORM_LIMITS.PERCENTAGE_MIN ||
        current > PROMOTION_FORM_LIMITS.PERCENTAGE_MAX
      ) {
        setValue(
          'discount_value',
          initialPromotion?.discount_type === 'PERCENTAGE'
            ? initialPromotion.discount_value
            : PROMOTION_FORM_LIMITS.PERCENTAGE_MIN,
          { shouldValidate: true },
        )
      }
    } else if (
      current < PROMOTION_FORM_LIMITS.FIXED_AMOUNT_MIN ||
      current > PROMOTION_FORM_LIMITS.FIXED_AMOUNT_MAX
    ) {
      setValue(
        'discount_value',
        initialPromotion?.discount_type === 'FIXED_AMOUNT'
          ? initialPromotion.discount_value
          : PROMOTION_FORM_LIMITS.FIXED_AMOUNT_MIN,
        { shouldValidate: true },
      )
    }
  }, [discountType, isPercentage, setValue, watch, initialPromotion])

  useEffect(() => {
    if (selectedPackageIds.length === 0) return
    const allowedIds = new Set(packageOptions.map((pkg) => pkg.id))
    const filtered = selectedPackageIds.filter((id) => allowedIds.has(id))
    if (filtered.length !== selectedPackageIds.length) {
      setValue('applicable_service_package_ids', filtered, { shouldValidate: true })
    }
  }, [packageOptions, selectedPackageIds, setValue])

  const toggleTier = (tier: LoyaltyTier) => {
    const next = selectedTiers.includes(tier)
      ? selectedTiers.filter((item) => item !== tier)
      : [...selectedTiers, tier]
    setValue('applicable_tiers', next, { shouldValidate: true })
  }

  const toggleVehicleType = (vehicleType: VehicleType) => {
    const next = selectedVehicleTypes.includes(vehicleType)
      ? selectedVehicleTypes.filter((item) => item !== vehicleType)
      : [...selectedVehicleTypes, vehicleType]
    setValue('applicable_vehicle_types', next, { shouldValidate: true })
  }

  const togglePackage = (packageId: string) => {
    const next = selectedPackageIds.includes(packageId)
      ? selectedPackageIds.filter((item) => item !== packageId)
      : [...selectedPackageIds, packageId]
    setValue('applicable_service_package_ids', next, { shouldValidate: true })
  }

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit({
      ...values,
      start_at: fromDatetimeLocalToApiIso(values.start_at),
      end_at: fromDatetimeLocalToApiIso(values.end_at),
      usage_limit: values.usage_limit ?? null,
      per_customer_limit: values.per_customer_limit ?? null,
      max_discount_amount:
        values.discount_type === 'PERCENTAGE'
          ? values.max_discount_amount ?? null
          : null,
    })
  })

  const discountValueMin = isPercentage
    ? PROMOTION_FORM_LIMITS.PERCENTAGE_MIN
    : PROMOTION_FORM_LIMITS.FIXED_AMOUNT_MIN
  const discountValueMax = isPercentage
    ? PROMOTION_FORM_LIMITS.PERCENTAGE_MAX
    : PROMOTION_FORM_LIMITS.FIXED_AMOUNT_MAX
  const discountValueStep = isPercentage ? 1 : 1000
  // HTML5 step validation yêu cầu `value - min` chia hết cho step.
  // Với FIXED_AMOUNT min=0.01 + step=1000, browser chỉ chấp nhận
  // 0.01, 1000.01, 2000.01, ... — gây lỗi "Please enter a valid value.
  // The two nearest valid values are ..." khi user nhập số chẵn.
  // Dùng step="any" cho FIXED_AMOUNT để nhập tuỳ ý;
  // zod schema + BE validator vẫn enforce range.
  const discountValueHtmlStep = isPercentage ? discountValueStep : 'any'
  const discountValueHint = isPercentage
    ? `Từ ${PROMOTION_FORM_LIMITS.PERCENTAGE_MIN}% đến ${PROMOTION_FORM_LIMITS.PERCENTAGE_MAX}%.`
    : `Từ ${PROMOTION_FORM_LIMITS.FIXED_AMOUNT_MIN.toLocaleString('vi-VN')} đến ${PROMOTION_FORM_LIMITS.FIXED_AMOUNT_MAX.toLocaleString('vi-VN')} VND, bước nhảy 1.000 VND.`

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
            {isPercentage ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VND)'}
          </Label>
          <Input
            id="discount_value"
            type="number"
            min={discountValueMin}
            max={discountValueMax}
            step={discountValueHtmlStep}
            error={errors.discount_value?.message}
            {...register('discount_value', { valueAsNumber: true })}
          />
          <p className="mt-1 text-xs text-slate-500">{discountValueHint}</p>
        </div>

        {isPercentage ? (
          <div>
            <Label htmlFor="max_discount_amount">Giảm tối đa (VND)</Label>
            <Input
              id="max_discount_amount"
              type="number"
              min={PROMOTION_FORM_LIMITS.FIXED_AMOUNT_MIN}
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
            min={MIN_ORDER_AMOUNT_FALLBACK}
            step="any"
            error={errors.min_order_amount?.message}
            {...register('min_order_amount', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label htmlFor="audience">Đối tượng</Label>
          <Select
            id="audience"
            error={errors.audience?.message}
            {...register('audience')}
          >
            {PROMOTION_AUDIENCES.map((audience) => (
              <option key={audience} value={audience}>
                {PROMOTION_AUDIENCE_LABELS[audience]}
              </option>
            ))}
          </Select>
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

        <div className="sm:col-span-2 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
              {...register('phone_required')}
            />
            Yêu cầu nhập SĐT khi áp dụng
          </label>

          <div className="flex min-w-[260px] flex-1 items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="per_phone_limit">Giới hạn / SĐT (1)</Label>
              <Input
                id="per_phone_limit"
                type="number"
                min={1}
                max={1}
                placeholder="1"
                disabled={!watch('phone_required')}
                error={errors.per_phone_limit?.message}
                {...register('per_phone_limit', {
                  setValueAs: (value) =>
                    value === '' || value == null ? null : Number(value),
                })}
              />
            </div>
          </div>
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

      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
        <p className="mb-1 text-sm font-semibold text-slate-800">Loại xe áp dụng</p>
        <p className="mb-3 text-xs text-slate-500">
          Để trống = áp dụng cho tất cả loại xe.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {vehicleTypes.map((vehicleType) => (
            <label
              key={vehicleType}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/80 bg-white px-3 py-2"
            >
              <input
                type="checkbox"
                checked={selectedVehicleTypes.includes(vehicleType)}
                onChange={() => toggleVehicleType(vehicleType)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              <span className="text-sm text-slate-700">
                {VEHICLE_TYPE_LABELS[vehicleType]}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
        <p className="mb-1 text-sm font-semibold text-slate-800">Gói dịch vụ áp dụng</p>
        <p className="mb-3 text-xs text-slate-500">
          Để trống = áp dụng cho tất cả gói. Danh sách lọc theo loại xe đã chọn ở trên.
        </p>
        {selectedVehicleTypes.length === 0 && packageOptions.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có gói dịch vụ khả dụng.</p>
        ) : packageOptions.length === 0 ? (
          <p className="text-sm text-slate-500">
            Không có gói nào thuộc loại xe đã chọn.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {packageOptions.map((pkg) => (
              <label
                key={pkg.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/80 bg-white px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={selectedPackageIds.includes(pkg.id)}
                  onChange={() => togglePackage(pkg.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {pkg.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {VEHICLE_TYPE_LABELS[pkg.vehicle_type]}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-brand-600"
          {...register('is_active')}
        />
        <span className="text-sm font-medium text-slate-700">
          Đang hoạt động (is_active)
        </span>
      </label>

      {mode === 'edit' && initialPromotion ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>
            Đã sử dụng: <strong>{initialPromotion.used_count}</strong>
            {initialPromotion.usage_limit != null
              ? ` / ${initialPromotion.usage_limit} lượt`
              : ' lượt (không giới hạn)'}
            {initialPromotion.reserved_count > 0
              ? ` · đang giữ chỗ ${initialPromotion.reserved_count}`
              : ''}
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
            'Tạo khuyến mãi'
          ) : (
            'Lưu thay đổi'
          )}
        </Button>
      </div>
    </form>
  )
}

const MIN_ORDER_AMOUNT_FALLBACK = 0
