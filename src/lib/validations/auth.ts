import { z } from 'zod'

const phoneRegex = /^(0|\+84)[0-9]{9,10}$/

export const loginSchema = z.object({
  phone: z
    .string()
    .min(1, 'Vui lòng nhập số điện thoại')
    .regex(phoneRegex, 'Số điện thoại không hợp lệ'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(1, 'Vui lòng nhập họ và tên')
      .min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
    phone: z
      .string()
      .min(1, 'Vui lòng nhập số điện thoại')
      .regex(phoneRegex, 'Số điện thoại không hợp lệ'),
    email: z
      .string()
      .min(1, 'Vui lòng nhập email')
      .email('Email không hợp lệ'),
    password: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu')
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirm_password: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirm_password'],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
