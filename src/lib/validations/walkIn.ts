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
  engine_type: z.enum(['GASOLINE', 'ELECTRIC']),
  motorbike_cc_group: z.enum(['UNDER_175CC', 'OVER_175CC']).nullable().optional(),
  car_body_type: z
    .enum(['HATCHBACK', 'SEDAN', 'SUV', 'MPV', 'PICKUP', 'VAN'])
    .nullable()
    .optional(),
  seat_count: z.number().int().min(2).max(16).nullable().optional(),
  service_package_id: z.string().min(1, 'Vui lòng chọn gói dịch vụ'),
  promotion_code: z.string().optional(),
  voucher_code: z.string().optional(),
  note: z.string().optional(),
}).superRefine((data, context) => {
  if (data.vehicle_type === 'CAR') {
    if (!data.car_body_type) {
      context.addIssue({
        code: 'custom',
        path: ['car_body_type'],
        message: 'Vui lòng chọn kiểu dáng xe',
      })
    }
    if (!data.seat_count) {
      context.addIssue({
        code: 'custom',
        path: ['seat_count'],
        message: 'Vui lòng nhập số chỗ ngồi',
      })
    }
  }
  if (data.vehicle_type === 'MOTORBIKE' && !data.motorbike_cc_group) {
    context.addIssue({
      code: 'custom',
      path: ['motorbike_cc_group'],
      message: 'Vui lòng chọn nhóm phân khối',
    })
  }
})

export type WalkInFormValues = z.infer<typeof walkInSchema>
