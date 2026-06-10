import { z } from 'zod'
import type { ServiceType } from '../../types/servicePackage'
import type { VehicleType } from '../../types/washBay'

const vehicleTypes = ['MOTORBIKE', 'CAR'] as const satisfies readonly VehicleType[]
const serviceTypes = ['WASH', 'ADDON', 'COMBO'] as const satisfies readonly ServiceType[]

export const adminServicePackageFormSchema = z
  .object({
    name: z.string().min(2, 'Tên gói tối thiểu 2 ký tự'),
    vehicle_type: z.enum(vehicleTypes, { message: 'Chọn loại xe' }),
    service_type: z.enum(serviceTypes, {
      message: 'Chọn loại dịch vụ',
    }),
    description: z.string().min(5, 'Mô tả tối thiểu 5 ký tự'),
    base_price: z
      .number({ message: 'Nhập giá hợp lệ' })
      .min(1000, 'Giá tối thiểu 1.000đ'),
    duration_minutes: z
      .number({ message: 'Nhập thời lượng hợp lệ' })
      .min(5, 'Tối thiểu 5 phút')
      .max(300, 'Tối đa 300 phút'),
    wash_bay_duration_minutes: z
      .number({ message: 'Nhập số phút hợp lệ' })
      .min(5)
      .max(180)
      .nullable()
      .optional(),
    points_earned: z
      .number({ message: 'Nhập điểm hợp lệ' })
      .min(0, 'Điểm không được âm'),
    requires_wash_bay: z.boolean(),
    requires_care_staff: z.boolean(),
    included_service_ids: z.array(z.string()),
    is_active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.requires_wash_bay && (data.wash_bay_duration_minutes == null || data.wash_bay_duration_minutes <= 0)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Nhập thời gian sử dụng buồng rửa',
        path: ['wash_bay_duration_minutes'],
      })
    }
  })

export type AdminServicePackageFormValues = z.infer<typeof adminServicePackageFormSchema>
