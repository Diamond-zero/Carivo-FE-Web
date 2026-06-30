export type InspectionType = 'BEFORE_WASH' | 'AFTER_WASH'

/**
 * BE trả về object[] cho phép caption/public_id (swagger CreateVehicleInspectionRequest).
 * Sau khi mapper normalize, FE dùng string[] để dễ render.
 */
export interface ApiInspectionImage {
  image_url: string
  public_id?: string
  caption?: string
}

export interface VehicleInspection {
  id: string
  booking_id: string
  type: InspectionType
  note: string
  images: string[]
  inspected_by: string
  inspected_at: string
}