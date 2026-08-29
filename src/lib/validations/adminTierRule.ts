import { z } from 'zod'

export const LOYALTY_TIER_OPTIONS = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const

export const adminTierRuleFormSchema = z.object({
  tier_name: z.enum(LOYALTY_TIER_OPTIONS, {
    message: 'Tên hạng phải là BRONZE, SILVER, GOLD hoặc PLATINUM',
  }),
  min_total_points: z.number({ message: 'Nhập tổng điểm hợp lệ' }).min(0, 'Tổng điểm không được âm'),
  min_total_spent: z.number({ message: 'Nhập tổng chi tiêu hợp lệ' }).min(0, 'Tổng chi tiêu không được âm'),
  min_total_visits: z.number({ message: 'Nhập số lượt ghé hợp lệ' }).min(0, 'Số lượt ghé không được âm').int('Số lượt ghé phải là số nguyên'),
  booking_window_days: z.number({ message: 'Nhập số ngày hợp lệ' }).min(1, 'Tối thiểu 1 ngày').max(60, 'Tối đa 60 ngày').int('Số ngày phải là số nguyên'),
  max_upcoming_bookings: z.number({ message: 'Nhập số booking hợp lệ' }).min(1, 'Tối thiểu 1 booking').max(10, 'Tối đa 10 booking').int('Phải là số nguyên'),
  point_multiplier: z.number({ message: 'Nhập hệ số điểm hợp lệ' }).min(0, 'Hệ số điểm không được âm').max(3, 'Hệ số tối đa 3'),
  priority_level: z.number({ message: 'Nhập mức ưu tiên hợp lệ' }).min(1, 'Tối thiểu 1').int('Mức ưu tiên phải là số nguyên'),
  is_active: z.boolean(),
})

export type AdminTierRuleFormValues = z.infer<typeof adminTierRuleFormSchema>
export const createAdminTierRuleFormSchema = adminTierRuleFormSchema
export type CreateAdminTierRuleFormValues = AdminTierRuleFormValues
