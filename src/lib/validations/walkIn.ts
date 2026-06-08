import { z } from 'zod'

const phoneRegex = /^(0|\+84)[0-9]{9,10}$/

export const walkInSchema = z.object({
  guest_name: z
    .string()
    .min(1, 'Vui lòng nhập họ và tên')
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  guest_phone: z
    .string()
    .min(1, 'Vui lòng nhập số điện thoại')
    .regex(phoneRegex, 'Số điện thoại không hợp lệ'),
  guest_email: z
    .string()
    .email('Email không hợp lệ')
    .optional()
    .or(z.literal('')),
  license_plate: z
    .string()
    .min(1, 'Vui lòng nhập biển số')
    .min(4, 'Biển số không hợp lệ'),
  vehicle_type: z.enum(['MOTORBIKE', 'CAR']),
  service_package_id: z.string().min(1, 'Vui lòng chọn gói dịch vụ'),
  start_time: z.string().min(1, 'Vui lòng chọn thời gian'),
  note: z.string().optional(),
})

export type WalkInFormValues = z.infer<typeof walkInSchema>
