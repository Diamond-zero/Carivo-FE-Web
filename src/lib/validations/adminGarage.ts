import { z } from 'zod'

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

export const adminGarageFormSchema = z
  .object({
    name: z.string().min(2, 'Tên garage tối thiểu 2 ký tự'),
    garage_code: z
      .string()
      .min(3, 'Mã garage tối thiểu 3 ký tự')
      .regex(/^[A-Z0-9-]+$/, 'Chỉ dùng chữ in hoa, số và dấu gạch ngang'),
    address: z.string().min(5, 'Nhập địa chỉ đầy đủ'),
    city: z.string().min(2, 'Nhập thành phố'),
    phone: z
      .string()
      .min(9, 'Số điện thoại không hợp lệ')
      .regex(/^[0-9+\s()-]+$/, 'Số điện thoại không hợp lệ'),
    opening_time: z.string().regex(timePattern, 'Định dạng HH:mm'),
    closing_time: z.string().regex(timePattern, 'Định dạng HH:mm'),
    slot_interval_minutes: z
      .number({ message: 'Nhập số phút hợp lệ' })
      .min(15, 'Tối thiểu 15 phút')
      .max(120, 'Tối đa 120 phút'),
    is_active: z.boolean(),
  })
  .refine((data) => data.opening_time < data.closing_time, {
    message: 'Giờ đóng cửa phải sau giờ mở cửa',
    path: ['closing_time'],
  })

export type AdminGarageFormValues = z.infer<typeof adminGarageFormSchema>
