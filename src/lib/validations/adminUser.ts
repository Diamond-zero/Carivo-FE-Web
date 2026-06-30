import { z } from 'zod'

const phoneRegex = /^(0|\+84)[0-9]{9,10}$/

export const adminCreateUserSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Họ tên tối thiểu 2 ký tự')
    .max(80, 'Họ tên tối đa 80 ký tự'),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Số điện thoại không hợp lệ (vd. 0901234567)'),
  email: z
    .string()
    .trim()
    .email('Email không hợp lệ')
    .max(120, 'Email tối đa 120 ký tự')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(6, 'Mật khẩu tối thiểu 6 ký tự')
    .max(64, 'Mật khẩu tối đa 64 ký tự'),
  role: z.enum(['CUSTOMER', 'STAFF'], {
    message: 'Chọn vai trò',
  }),
  is_active: z.boolean(),
})

export type AdminCreateUserValues = z.infer<typeof adminCreateUserSchema>

export const adminPromoteUserSchema = z.object({
  user_id: z.string().min(1, 'Chọn tài khoản cần nâng cấp'),
  role: z.enum(['STAFF', 'ADMIN'], {
    message: 'Chọn vai trò mới',
  }),
})

export type AdminPromoteUserValues = z.infer<typeof adminPromoteUserSchema>