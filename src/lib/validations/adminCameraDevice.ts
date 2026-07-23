import { z } from 'zod'

export const createCameraDeviceSchema = z.object({
  device_code: z
    .string()
    .min(3, 'Mã camera tối thiểu 3 ký tự')
    .max(64, 'Mã camera tối đa 64 ký tự')
    .regex(/^[A-Z0-9_-]+$/i, 'Chỉ dùng chữ, số, gạch dưới hoặc gạch ngang'),
  name: z.string().min(2, 'Tên camera tối thiểu 2 ký tự').max(100, 'Tối đa 100 ký tự'),
  garage_id: z.string().min(1, 'Chọn garage'),
  location: z.string().max(255, 'Tối đa 255 ký tự').optional().or(z.literal('')),
})

export type CreateCameraDeviceValues = z.infer<typeof createCameraDeviceSchema>
