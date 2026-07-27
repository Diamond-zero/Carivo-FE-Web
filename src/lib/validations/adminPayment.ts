import { z } from 'zod'

/**
 * Schema cho modal "Huỷ payment" — bắt buộc lý do (BE đôi khi lưu audit).
 *
 * BE swagger `cancelPaymentRequest`:
 *   { reason?: string } — optional, nhưng staff workflow yêu cầu nhập.
 */
export const cancelAdminPaymentSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Vui lòng nhập lý do (tối thiểu 5 ký tự).')
    .max(500, 'Lý do tối đa 500 ký tự.'),
})

export type CancelAdminPaymentFormValues = z.infer<typeof cancelAdminPaymentSchema>

/**
 * Schema cho modal "Đánh dấu hết hạn" — BE không yêu cầu body nhưng staff
 * vẫn có thể nhập ghi chú audit.
 */
export const expireAdminPaymentSchema = z.object({
  note: z
    .string()
    .trim()
    .max(500, 'Ghi chú tối đa 500 ký tự.')
    .optional()
    .or(z.literal('')),
})

export type ExpireAdminPaymentFormValues = z.infer<typeof expireAdminPaymentSchema>
