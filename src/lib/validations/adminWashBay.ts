import { z } from 'zod'

const vehicleTypes = ['MOTORBIKE', 'CAR'] as const
const editableStatuses = ['AVAILABLE', 'MAINTENANCE', 'INACTIVE'] as const

export const adminWashBayFormSchema = z.object({
  garage_id: z.string().min(1, 'Chọn garage'),
  name: z.string().min(2, 'Tên buồng rửa tối thiểu 2 ký tự'),
  bay_code: z
    .string()
    .min(2, 'Mã buồng tối thiểu 2 ký tự')
    .regex(/^[A-Z0-9-]+$/, 'Chỉ dùng chữ in hoa, số và dấu gạch ngang'),
  vehicle_type: z.enum(vehicleTypes, { message: 'Chọn loại xe' }),
  status: z.enum(editableStatuses, { message: 'Chọn trạng thái' }),
  is_active: z.boolean(),
})

export type AdminWashBayFormValues = z.infer<typeof adminWashBayFormSchema>

export const adminWashBayCreateSchema = adminWashBayFormSchema.omit({ status: true })

export type AdminWashBayCreateValues = z.infer<typeof adminWashBayCreateSchema>
