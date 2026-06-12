import { z } from 'zod'
import type { ServiceStepType } from '../../types/servicePackage'
import type { StaffType } from '../../types/staffProfile'

const serviceStepTypes = ['AUTOMATED_WASH_STEP', 'MANUAL_SERVICE_STEP'] as const satisfies readonly ServiceStepType[]
const staffTypes = [
  'CUSTOMER_SERVICE_STAFF',
  'VEHICLE_INSPECTION_STAFF',
  'WASH_OPERATOR',
  'VEHICLE_CARE_STAFF',
] as const satisfies readonly StaffType[]

export const serviceStepTemplateSchema = z.object({
  step_code: z.string().min(1, 'Nhập mã bước'),
  step_name: z.string().min(2, 'Tên bước tối thiểu 2 ký tự'),
  order: z.number().min(1),
  step_type: z.enum(serviceStepTypes, { message: 'Chọn loại bước' }),
  is_required: z.boolean(),
  display_staff_type: z.enum(staffTypes, { message: 'Chọn vai trò hiển thị' }),
  instructions: z
    .array(z.string())
    .min(1, 'Cần ít nhất 1 hướng dẫn')
    .refine((items) => items.some((item) => item.trim().length > 0), {
      message: 'Cần ít nhất 1 hướng dẫn không rỗng',
    }),
})

export const adminServicePackageStepsSchema = z
  .object({
    steps: z.array(serviceStepTemplateSchema).min(1, 'Cần ít nhất 1 bước thực hiện'),
  })
  .superRefine((data, ctx) => {
    const codes = data.steps.map((step) => step.step_code.trim().toLowerCase())
    const seen = new Set<string>()

    for (const code of codes) {
      if (seen.has(code)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Mã bước (step_code) không được trùng nhau trong cùng gói',
          path: ['steps'],
        })
        break
      }
      seen.add(code)
    }
  })

export type AdminServicePackageStepsValues = z.infer<typeof adminServicePackageStepsSchema>
