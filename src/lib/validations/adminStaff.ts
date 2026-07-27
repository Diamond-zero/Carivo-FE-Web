import { z } from 'zod'
import type { StaffType } from '../../types/staffProfile'

const staffTypeValues = [
  'CUSTOMER_SERVICE_STAFF',
  'VEHICLE_INSPECTION_STAFF',
  'WASH_OPERATOR',
  'VEHICLE_CARE_STAFF',
] as const satisfies readonly StaffType[]

/**
 * Regex mã nhân viên — đồng bộ với BE `staffProfile.validator.js`:
 *
 *   const staffCodeField = z.string().trim()
 *     .min(2, 'Staff code must have at least 2 characters')
 *     .max(30, 'Staff code must have at most 30 characters')
 *     .regex(/^[A-Za-z0-9_-]+$/, 'Staff code is invalid');
 *
 * BE chỉ ràng buộc: chữ cái (HOA/thường), chữ số, gạch dưới, gạch ngang.
 * KHÔNG bắt buộc bắt đầu bằng "STF" — hệ thống chấp nhận nhiều prefix
 * tuỳ role (CARE…, INSP…, STF…, WASH…) do admin tự đặt.
 */
const staffCodeSchema = z
  .string()
  .trim()
  .min(2, 'Mã nhân viên tối thiểu 2 ký tự')
  .max(30, 'Mã nhân viên tối đa 30 ký tự')
  .regex(
    /^[A-Za-z0-9_-]+$/,
    'Mã chỉ gồm chữ cái, chữ số, gạch dưới (_) hoặc gạch ngang (-)',
  )

/** Schema dùng cho Create — staff_type bắt buộc (BE yêu cầu). */
export const adminStaffCreateSchema = z.object({
  user_id: z.string().min(1, 'Chọn nhân viên'),
  staff_code: staffCodeSchema,
  staff_type: z.enum(staffTypeValues, {
    message: 'Chọn vai trò nhân viên',
  }),
  garage_id: z.string().optional(),
})

/**
 * Schema cho Edit — BE `StaffProfileUpdateRequest` không chấp nhận
 * `staff_type` (chỉ đổi qua workflow `staff-type-change-requests`) và
 * `is_active` (chỉ đổi qua endpoint riêng `PATCH /staff-profiles/:id/status`).
 * Vì vậy form Edit bỏ 2 field này và thay bằng:
 *   - Nút "Yêu cầu chuyển chức năng" cho staff_type.
 *   - Nút "Khoá / Mở khoá nhân viên" cho is_active.
 */
export const adminStaffEditSchema = z.object({
  user_id: z.string().min(1, 'Chọn nhân viên'),
  staff_code: staffCodeSchema,
  garage_id: z.string().optional(),
})

/**
 * Schema hợp nhất — form dùng discriminator để chọn create/edit. Hiện tại
 * form thật chỉ render `staff_type` ở create, nhưng giữ type tổng quát để
 * FE cũ vẫn tương thích.
 */
export const adminStaffFormSchema = adminStaffCreateSchema

export type AdminStaffCreateFormValues = z.infer<typeof adminStaffCreateSchema>
export type AdminStaffEditFormValues = z.infer<typeof adminStaffEditSchema>
export type AdminStaffFormValues = AdminStaffCreateFormValues