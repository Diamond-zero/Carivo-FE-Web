import type { VehicleInspection } from '../types/inspection'

export interface CreateInspectionInput {
  booking_id: string
  type: VehicleInspection['type']
  note: string
  images: string[]
}

export function buildInspection(
  data: CreateInspectionInput,
  staffProfileId: string,
): VehicleInspection {
  return {
    id: `inspection-${Date.now()}`,
    booking_id: data.booking_id,
    type: data.type,
    note: data.note.trim(),
    images: data.images,
    inspected_by: staffProfileId,
    inspected_at: new Date().toISOString().slice(0, 19),
  }
}
