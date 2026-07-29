import { z } from 'zod'
import type { DiscountType, PromotionAudience } from '../../types/promotion'
import type { LoyaltyTier } from '../../types/loyalty'
import type { VehicleType } from '../../types/washBay'
import { toApiDateTimeString } from '../../utils/walkIn'

const discountTypes = ['PERCENTAGE', 'FIXED_AMOUNT'] as const satisfies readonly DiscountType[]
const loyaltyTiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const satisfies readonly LoyaltyTier[]
const vehicleTypes = ['MOTORBIKE', 'CAR'] as const satisfies readonly VehicleType[]
const audiences = ['ALL', 'CUSTOMER', 'WALK_IN'] as const satisfies readonly PromotionAudience[]

const PERCENTAGE_MIN = 1
const PERCENTAGE_MAX = 100
const FIXED_AMOUNT_MIN = 0.01
const FIXED_AMOUNT_MAX = 100_000_000
const MIN_ORDER_AMOUNT_MIN = 0

export const adminPromotionFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, 'Mã tối thiểu 3 ký tự')
      .max(40, 'Mã tối đa 40 ký tự')
      .regex(/^[A-Za-z0-9_]+$/, 'Mã chỉ gồm chữ, số và dấu gạch dưới (_)'),
    name: z.string().trim().min(2, 'Tên tối thiểu 2 ký tự').max(150, 'Tên tối đa 150 ký tự'),
    description: z
      .string()
      .trim()
      .max(2000, 'Mô tả tối đa 2000 ký tự'),
    discount_type: z.enum(discountTypes, { message: 'Chọn loại giảm giá' }),
    discount_value: z
      .number({ message: 'Nhập số tiền hoặc phần trăm giảm hợp lệ' })
      .finite()
      .positive('Giá trị giảm phải lớn hơn 0'),
    max_discount_amount: z
      .number({ message: 'Nhập số tiền hợp lệ' })
      .finite()
      .int()
      .min(FIXED_AMOUNT_MIN, `Trần giảm tối thiểu ${FIXED_AMOUNT_MIN.toLocaleString('vi-VN')} VND`)
      .max(FIXED_AMOUNT_MAX, `Trần giảm tối đa ${FIXED_AMOUNT_MAX.toLocaleString('vi-VN')} VND`)
      .nullable()
      .optional(),
    min_order_amount: z
      .number({ message: 'Nhập đơn tối thiểu hợp lệ' })
      .finite()
      .min(MIN_ORDER_AMOUNT_MIN, 'Đơn tối thiểu không được âm')
      .max(FIXED_AMOUNT_MAX, `Đơn tối thiểu tối đa ${FIXED_AMOUNT_MAX.toLocaleString('vi-VN')} VND`),
    audience: z.enum(audiences),
    phone_required: z.boolean(),
    per_phone_limit: z
      .number({ message: 'Nhập giới hạn mỗi SĐT hợp lệ' })
      .finite()
      .int()
      .min(1, 'Giới hạn mỗi SĐT tối thiểu 1')
      .max(1, 'Giới hạn mỗi SĐT tối đa 1 (BE cho phép tối đa 1)')
      .nullable()
      .optional(),
    applicable_tiers: z
      .array(z.enum(loyaltyTiers))
      .min(1, 'Chọn ít nhất 1 hạng áp dụng'),
    applicable_vehicle_types: z.array(z.enum(vehicleTypes)),
    applicable_service_package_ids: z.array(z.string()),
    usage_limit: z
      .number({ message: 'Nhập giới hạn hợp lệ' })
      .finite()
      .int()
      .min(1, 'Giới hạn lượt dùng tối thiểu 1')
      .nullable()
      .optional(),
    per_customer_limit: z
      .number({ message: 'Nhập giới hạn/khách hợp lệ' })
      .finite()
      .int()
      .min(1, 'Giới hạn mỗi khách tối thiểu 1')
      .nullable()
      .optional(),
    start_at: z.string().min(1, 'Chọn thời gian bắt đầu'),
    end_at: z.string().min(1, 'Chọn thời gian kết thúc'),
    is_active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.discount_type === 'PERCENTAGE') {
      if (data.discount_value > PERCENTAGE_MAX) {
        ctx.addIssue({
          code: 'custom',
          message: `Phần trăm giảm tối đa ${PERCENTAGE_MAX}%`,
          path: ['discount_value'],
        })
      }
      if (data.discount_value < PERCENTAGE_MIN) {
        ctx.addIssue({
          code: 'custom',
          message: `Phần trăm giảm tối thiểu ${PERCENTAGE_MIN}%`,
          path: ['discount_value'],
        })
      }
    }

    if (data.discount_type === 'FIXED_AMOUNT') {
      if (data.discount_value < FIXED_AMOUNT_MIN) {
        ctx.addIssue({
          code: 'custom',
          message: `Số tiền giảm tối thiểu ${FIXED_AMOUNT_MIN.toLocaleString('vi-VN')} VND`,
          path: ['discount_value'],
        })
      }
      if (data.discount_value > FIXED_AMOUNT_MAX) {
        ctx.addIssue({
          code: 'custom',
          message: `Số tiền giảm tối đa ${FIXED_AMOUNT_MAX.toLocaleString('vi-VN')} VND`,
          path: ['discount_value'],
        })
      }
      if (data.max_discount_amount != null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Giảm cố định không dùng trần giảm tối đa',
          path: ['max_discount_amount'],
        })
      }
    }

    if (data.phone_required && data.per_phone_limit == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Yêu cầu SĐT — hãy đặt giới hạn mỗi SĐT (1)',
        path: ['per_phone_limit'],
      })
    }

    const start = new Date(data.start_at).getTime()
    const end = new Date(data.end_at).getTime()
    if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
      ctx.addIssue({
        code: 'custom',
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
        path: ['end_at'],
      })
    }
  })

export type AdminPromotionFormValues = z.infer<typeof adminPromotionFormSchema>

export const PROMOTION_FORM_LIMITS = {
  PERCENTAGE_MIN,
  PERCENTAGE_MAX,
  FIXED_AMOUNT_MIN,
  FIXED_AMOUNT_MAX,
} as const

export function toDatetimeLocalValue(iso: string) {
  return iso.slice(0, 16)
}

export function fromDatetimeLocalValue(value: string) {
  if (value.length === 16) {
    return `${value}:00`
  }
  return value
}

/**
 * Convert `<input type="datetime-local">` value (e.g. `2026-07-04T04:01`) sang
 * ISO 8601 datetime có timezone offset (e.g. `2026-07-04T04:01:00+07:00`) mà
 * BE promotion.validator yêu cầu (`z.string().datetime({ offset: true })`).
 *
 * Input `datetime-local` không có timezone, mặc định hiểu là giờ local của user.
 * Không thông qua `new Date()` để tránh browser convert sang UTC rồi serialize
 * lại sai định dạng.
 */
export function fromDatetimeLocalToApiIso(value: string): string {
  if (!value) return value

  const [datePart] = value.split('T')
  if (!datePart) return value

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return toApiDateTimeString(date)
}
