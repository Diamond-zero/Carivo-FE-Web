import { z } from 'zod'

export const adminTierRuleFormSchema = z.object({
  min_total_spent: z
    .number({ message: 'Nhập tổng chi tiêu hợp lệ' })
    .min(0, 'Tổng chi tiêu không được âm'),
  min_total_visits: z
    .number({ message: 'Nhập số lượt ghé hợp lệ' })
    .min(0, 'Số lượt ghé không được âm')
    .int('Số lượt ghé phải là số nguyên'),
  booking_window_days: z
    .number({ message: 'Nhập số ngày hợp lệ' })
    .min(1, 'Tối thiểu 1 ngày')
    .max(60, 'Tối đa 60 ngày')
    .int('Số ngày phải là số nguyên'),
  max_upcoming_bookings: z
    .number({ message: 'Nhập số booking hợp lệ' })
    .min(1, 'Tối thiểu 1 booking')
    .max(10, 'Tối đa 10 booking')
    .int('Phải là số nguyên'),
  points_multiplier: z
    .number({ message: 'Nhập hệ số điểm hợp lệ' })
    .min(1, 'Hệ số tối thiểu 1')
    .max(3, 'Hệ số tối đa 3'),
  priority_level: z
    .number({ message: 'Nhập mức ưu tiên hợp lệ' })
    .min(1, 'Tối thiểu 1')
    .max(10, 'Tối đa 10')
    .int('Mức ưu tiên phải là số nguyên'),
  is_active: z.boolean(),
})

export type AdminTierRuleFormValues = z.infer<typeof adminTierRuleFormSchema>
