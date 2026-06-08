export type InspectionType = 'BEFORE_WASH' | 'AFTER_WASH'

export interface VehicleInspection {
  id: string
  booking_id: string
  type: InspectionType
  note: string
  images: string[]
  inspected_by: string
  inspected_at: string
}
