import { z } from 'zod'
import type { StaffType } from '../../types/staffProfile'

const staffTypeValues = [
  'CUSTOMER_SERVICE_STAFF',
  'VEHICLE_INSPECTION_STAFF',
  'WASH_OPERATOR',
  'VEHICLE_CARE_STAFF',
] as const satisfies readonly StaffType[]

export const adminStaffFormSchema = z.object({
  user_id: z.string().min(1, 'Chọn nhân viên'),
  staff_code: z
    .string()
    .min(3, 'Mã nhân viên tối thiểu 3 ký tự')
    .regex(/^STF[A-Z0-9]+$/, 'Định dạng: STF + mã (vd. STF009)'),
  staff_type: z.enum(staffTypeValues, {
    message: 'Chọn vai trò nhân viên',
  }),
  garage_id: z.string().min(1, 'Chọn garage'),
  is_active: z.boolean(),
})

export type AdminStaffFormValues = z.infer<typeof adminStaffFormSchema>
