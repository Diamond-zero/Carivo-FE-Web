import type { StaffType } from './staffProfile'

export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED'
export type StepType = 'AUTOMATED_WASH_STEP' | 'MANUAL_SERVICE_STEP'

export interface BookingServiceStep {
  id: string
  booking_id: string
  step_code: string
  step_name: string
  order: number
  step_type: StepType
  display_staff_type: StaffType
  assigned_staff_id: string | null
  confirmed_by_staff_id: string | null
  status: StepStatus
  instructions: string[]
  started_at: string | null
  completed_at: string | null
}
