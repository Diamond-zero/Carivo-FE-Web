import { z } from 'zod'
import type { DiscountType } from '../../types/promotion'
import type { LoyaltyTier } from '../../types/loyalty'

const discountTypes = ['PERCENTAGE', 'FIXED_AMOUNT'] as const satisfies readonly DiscountType[]
const loyaltyTiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const satisfies readonly LoyaltyTier[]

export const adminPromotionFormSchema = z
  .object({
    code: z
      .string()
      .min(3, 'Mã tối thiểu 3 ký tự')
      .max(20, 'Mã tối đa 20 ký tự')
      .regex(/^[A-Za-z0-9_-]+$/, 'Mã chỉ gồm chữ, số, gạch ngang'),
    name: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
    description: z.string().min(5, 'Mô tả tối thiểu 5 ký tự'),
    discount_type: z.enum(discountTypes, { message: 'Chọn loại giảm giá' }),
    discount_value: z.number({ message: 'Nhập giá trị giảm hợp lệ' }).min(1),
    max_discount_amount: z
      .number({ message: 'Nhập số tiền hợp lệ' })
      .min(1000)
      .nullable()
      .optional(),
    min_order_amount: z
      .number({ message: 'Nhập đơn tối thiểu hợp lệ' })
      .min(0, 'Đơn tối thiểu không được âm'),
    applicable_tiers: z
      .array(z.enum(loyaltyTiers))
      .min(1, 'Chọn ít nhất 1 hạng áp dụng'),
    usage_limit: z
      .number({ message: 'Nhập giới hạn hợp lệ' })
      .min(1)
      .nullable()
      .optional(),
    start_at: z.string().min(1, 'Chọn thời gian bắt đầu'),
    end_at: z.string().min(1, 'Chọn thời gian kết thúc'),
    is_active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.discount_type === 'PERCENTAGE') {
      if (data.discount_value > 100) {
        ctx.addIssue({
          code: 'custom',
          message: 'Phần trăm giảm tối đa 100%',
          path: ['discount_value'],
        })
      }
    }

    if (data.discount_type === 'FIXED_AMOUNT' && data.max_discount_amount != null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Giảm cố định không dùng trần giảm tối đa',
        path: ['max_discount_amount'],
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

export function toDatetimeLocalValue(iso: string) {
  return iso.slice(0, 16)
}

export function fromDatetimeLocalValue(value: string) {
  if (value.length === 16) {
    return `${value}:00`
  }
  return value
}
