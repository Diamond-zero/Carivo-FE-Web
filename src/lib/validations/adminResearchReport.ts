import { z } from 'zod'

const reportFilterSchema = z.object({
  survey_id: z.string().min(1, 'Chọn khảo sát'),
  from: z.string().nullable().optional(),
  to: z.string().nullable().optional(),
  garage_id: z.string().nullable().optional(),
  service_package_id: z.string().nullable().optional(),
  vehicle_type: z.enum(['MOTORBIKE', 'CAR']).nullable().optional(),
  group_by: z.enum(['DAY', 'WEEK', 'MONTH']).optional(),
})

export const adminResearchReportFormSchema = z.object({
  title: z.string().min(3, 'Tiêu đề tối thiểu 3 ký tự'),
  objective: z.string().min(3, 'Mục tiêu tối thiểu 3 ký tự'),
  type: z.literal('SURVEY_INSIGHT'),
  filters: reportFilterSchema,
})

export type AdminResearchReportFormValues = z.infer<typeof adminResearchReportFormSchema>