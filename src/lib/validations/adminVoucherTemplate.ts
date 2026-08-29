import { z } from 'zod'
import type { VoucherType } from '../../types/voucherTemplate'
import {
  fromDatetimeLocalToApiIso,
  toDatetimeLocalValue,
} from './adminPromotion'

export { fromDatetimeLocalToApiIso, toDatetimeLocalValue }

const voucherTypes = ['FIXED_AMOUNT', 'PERCENTAGE', 'FREE_SERVICE'] as const satisfies readonly VoucherType[]

const PERCENTAGE_MIN = 1
const PERCENTAGE_MAX = 100
const FIXED_AMOUNT_MIN = 0.01
const FIXED_AMOUNT_MAX = 100_000_000
const MIN_ORDER_AMOUNT_MIN = 0
const POINTS_COST_MIN = 1
const VALIDITY_DAYS_MIN = 1

export const adminVoucherTemplateFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Tên tối thiểu 2 ký tự').max(150, 'Tên tối đa 150 ký tự'),
    description: z.string().trim().max(2000, 'Mô tả tối đa 2000 ký tự'),
    voucher_type: z.enum(voucherTypes, { message: 'Chọn loại voucher' }),
    value: z
      .number({ message: 'Nhập số tiền hoặc phần trăm giảm hợp lệ' })
      .finite()
      .min(0, 'Giá trị giảm không hợp lệ'),
    max_discount_amount: z
      .number({ message: 'Nhập số tiền hợp lệ' })
      .finite()
      .min(FIXED_AMOUNT_MIN, `Trần giảm tối thiểu ${FIXED_AMOUNT_MIN.toLocaleString('vi-VN')} VND`)
      .max(FIXED_AMOUNT_MAX, `Trần giảm tối đa ${FIXED_AMOUNT_MAX.toLocaleString('vi-VN')} VND`)
      .nullable()
      .optional(),
    min_order_amount: z
      .number({ message: 'Nhập đơn tối thiểu hợp lệ' })
      .finite()
      .min(MIN_ORDER_AMOUNT_MIN, 'Đơn tối thiểu không được âm')
      .max(FIXED_AMOUNT_MAX, `Đơn tối thiểu tối đa ${FIXED_AMOUNT_MAX.toLocaleString('vi-VN')} VND`),
    service_package_id: z.string().nullable().optional(),
    points_cost: z
      .number({ message: 'Nhập số điểm cần đổi hợp lệ' })
      .finite()
      .int()
      .min(POINTS_COST_MIN, `Số điểm tối thiểu ${POINTS_COST_MIN}`),
    voucher_validity_days: z
      .number({ message: 'Nhập số ngày hiệu lực hợp lệ' })
      .finite()
      .int()
      .min(VALIDITY_DAYS_MIN, `Số ngày hiệu lực tối thiểu ${VALIDITY_DAYS_MIN}`),
    total_quantity: z
      .number({ message: 'Nhập số lượng hợp lệ' })
      .finite()
      .int()
      .min(1, 'Số lượng tối thiểu 1')
      .nullable()
      .optional(),
    per_customer_limit: z
      .number({ message: 'Nhập giới hạn/khách hợp lệ' })
      .finite()
      .int()
      .min(1, 'Giới hạn mỗi khách tối thiểu 1')
      .nullable()
      .optional(),
    applicable_tiers: z.array(z.string().min(1, 'Hạng loyalty không hợp lệ')),
    start_at: z.string().min(1, 'Chọn thời gian bắt đầu'),
    end_at: z.string().min(1, 'Chọn thời gian kết thúc'),
    is_active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.voucher_type === 'PERCENTAGE') {
      if (data.value > PERCENTAGE_MAX) {
        ctx.addIssue({
          code: 'custom',
          message: `Phần trăm giảm tối đa ${PERCENTAGE_MAX}%`,
          path: ['value'],
        })
      }
      if (data.value < PERCENTAGE_MIN) {
        ctx.addIssue({
          code: 'custom',
          message: `Phần trăm giảm tối thiểu ${PERCENTAGE_MIN}%`,
          path: ['value'],
        })
      }
    }

    if (data.voucher_type === 'FIXED_AMOUNT') {
      if (data.value < FIXED_AMOUNT_MIN) {
        ctx.addIssue({
          code: 'custom',
          message: `Số tiền giảm tối thiểu ${FIXED_AMOUNT_MIN.toLocaleString('vi-VN')} VND`,
          path: ['value'],
        })
      }
      if (data.value > FIXED_AMOUNT_MAX) {
        ctx.addIssue({
          code: 'custom',
          message: `Số tiền giảm tối đa ${FIXED_AMOUNT_MAX.toLocaleString('vi-VN')} VND`,
          path: ['value'],
        })
      }
    }

    if (data.voucher_type === 'FREE_SERVICE' && !data.service_package_id) {
      ctx.addIssue({
        code: 'custom',
        message: 'Chọn gói dịch vụ được tặng',
        path: ['service_package_id'],
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

export type AdminVoucherTemplateFormValues = z.infer<typeof adminVoucherTemplateFormSchema>

export const VOUCHER_TEMPLATE_FORM_LIMITS = {
  PERCENTAGE_MIN,
  PERCENTAGE_MAX,
  FIXED_AMOUNT_MIN,
  FIXED_AMOUNT_MAX,
  POINTS_COST_MIN,
  VALIDITY_DAYS_MIN,
} as const

export function toLocalDatetimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
