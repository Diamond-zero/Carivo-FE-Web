import type { VehicleType } from './washBay'

export type ServiceType = 'WASH' | 'ADDON' | 'COMBO'
export type ServiceStepType = 'AUTOMATED_WASH_STEP' | 'MANUAL_SERVICE_STEP'

export interface ServiceStepTemplate {
  step_code: string
  step_name: string
  order: number
  step_type: ServiceStepType
  is_required: boolean
  display_staff_type: string
  instructions: string[]
}

export interface ServicePackage {
  id: string
  name: string
  vehicle_type: VehicleType
  service_type: ServiceType
  description: string
  base_price: number
  duration_minutes: number
  wash_bay_duration_minutes: number | null
  points_earned: number
  requires_wash_bay: boolean
  requires_care_staff: boolean
  included_service_ids: string[]
  steps_template: ServiceStepTemplate[]
  is_active: boolean
}
