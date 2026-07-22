import { z } from 'zod'
import type { StaffType } from '../../types/staffProfile'

const staffTypeValues = [
  'CUSTOMER_SERVICE_STAFF',
  'VEHICLE_INSPECTION_STAFF',
  'WASH_OPERATOR',
  'VEHICLE_CARE_STAFF',
] as const satisfies readonly StaffType[]

/** Schema dùng cho Create — staff_type bắt buộc (BE yêu cầu). */
export const adminStaffCreateSchema = z.object({
  user_id: z.string().min(1, 'Chọn nhân viên'),
  staff_code: z
    .string()
    .min(3, 'Mã nhân viên tối thiểu 3 ký tự')
    .regex(/^STF[A-Z0-9]+$/, 'Định dạng: STF + mã (vd. STF009)'),
  staff_type: z.enum(staffTypeValues, {
    message: 'Chọn vai trò nhân viên',
  }),
  garage_id: z.string().optional(),
  is_active: z.boolean(),
})

/**
 * Schema cho Edit — BE `StaffProfileUpdateRequest` không chấp nhận
 * `staff_type` (chỉ đổi qua workflow `staff-type-change-requests`). Vì vậy
 * form Edit bỏ field này và thay bằng nút "Yêu cầu chuyển chức năng".
 */
export const adminStaffEditSchema = z.object({
  user_id: z.string().min(1, 'Chọn nhân viên'),
  staff_code: z
    .string()
    .min(3, 'Mã nhân viên tối thiểu 3 ký tự')
    .regex(/^STF[A-Z0-9]+$/, 'Định dạng: STF + mã (vd. STF009)'),
  garage_id: z.string().optional(),
  is_active: z.boolean(),
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
