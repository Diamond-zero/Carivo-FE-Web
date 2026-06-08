import { z } from 'zod'

export const inspectionSchema = z.object({
  booking_id: z.string().min(1, 'Vui lòng chọn booking'),
  type: z.enum(['BEFORE_WASH', 'AFTER_WASH']),
  note: z
    .string()
    .min(1, 'Vui lòng nhập ghi chú kiểm tra')
    .min(5, 'Ghi chú phải có ít nhất 5 ký tự'),
})

export type InspectionFormValues = z.infer<typeof inspectionSchema>
