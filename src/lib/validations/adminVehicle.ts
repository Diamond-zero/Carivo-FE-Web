import { z } from 'zod'
import type {
  ApiCarBodyType,
  ApiMotorbikeCcGroup,
  ApiVehicleEngineType,
} from '../../types/api/admin'

const vehicleTypes = ['MOTORBIKE', 'CAR'] as const
const engineTypes = ['GASOLINE', 'ELECTRIC'] as const
const motorbikeCcGroups = ['UNDER_175CC', 'OVER_175CC'] as const
const carBodyTypes = [
  'HATCHBACK',
  'SEDAN',
  'SUV',
  'MPV',
  'PICKUP',
  'VAN',
] as const

export const vehicleBaseFormSchema = z
  .object({
    raw_license_plate: z
      .string()
      .min(3, 'Biển số tối thiểu 3 ký tự')
      .max(20, 'Biển số tối đa 20 ký tự'),
    vehicle_type: z.enum(vehicleTypes, { message: 'Chọn loại xe' }),
    engine_type: z.enum(engineTypes, { message: 'Chọn loại động cơ' }),
    motorbike_cc_group: z
      .enum(motorbikeCcGroups)
      .nullable()
      .optional(),
    car_body_type: z.enum(carBodyTypes).nullable().optional(),
    seat_count: z.coerce.number().int('Số chỗ phải là số nguyên').min(2).max(50).nullable().optional(),
    brand: z.string().max(80).optional(),
    model: z.string().max(80).optional(),
    color: z.string().max(40).optional(),
    is_default: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.vehicle_type === 'MOTORBIKE') {
      if (!data.motorbike_cc_group) {
        ctx.addIssue({
          path: ['motorbike_cc_group'],
          code: z.ZodIssueCode.custom,
          message: 'Chọn nhóm phân khối xe máy',
        })
      }
      if (data.car_body_type) {
        ctx.addIssue({
          path: ['car_body_type'],
          code: z.ZodIssueCode.custom,
          message: 'Xe máy không dùng kiểu dáng ô tô',
        })
      }
    }
    if (data.vehicle_type === 'CAR') {
      if (!data.car_body_type) {
        ctx.addIssue({
          path: ['car_body_type'],
          code: z.ZodIssueCode.custom,
          message: 'Chọn kiểu dáng xe ô tô',
        })
      }
      if (data.motorbike_cc_group) {
        ctx.addIssue({
          path: ['motorbike_cc_group'],
          code: z.ZodIssueCode.custom,
          message: 'Ô tô không dùng nhóm phân khối xe máy',
        })
      }
    }
  })

export type VehicleFormValues = z.infer<typeof vehicleBaseFormSchema>

export interface VehicleFormDefaults {
  raw_license_plate?: string
  vehicle_type?: 'MOTORBIKE' | 'CAR'
  engine_type?: ApiVehicleEngineType
  motorbike_cc_group?: ApiMotorbikeCcGroup | null
  car_body_type?: ApiCarBodyType | null
  seat_count?: number | null
  brand?: string | null
  model?: string | null
  color?: string | null
  is_default?: boolean
  is_active?: boolean
}

export const adminVehicleCreateSchema = vehicleBaseFormSchema.extend({
  customer_id: z.string().min(1, 'Chọn khách hàng sở hữu'),
})

export type AdminVehicleCreateValues = z.infer<typeof adminVehicleCreateSchema>