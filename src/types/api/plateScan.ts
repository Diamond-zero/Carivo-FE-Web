// ============================================================================
// Plate scan — Swagger [STAFF, ADMIN] License plate arrival verification
// ============================================================================

export type PlateScanStatus =
  | 'PENDING'
  | 'MATCHED'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'NEEDS_ALTERNATE_VEHICLE'
  | string

export type PlateScanCandidateStatus =
  | 'PENDING'
  | 'AWAITING_CONFIRMATION'
  | 'CONFIRMED'
  | 'REJECTED'
  | string

export interface ApiPlateScanCandidate {
  id: string
  booking_id: string
  booking_code?: string | null
  /** Mức độ khớp (0-1). */
  confidence: number
  detected_plate?: string | null
  expected_plate?: string | null
  status: PlateScanCandidateStatus
  vehicle_id?: string | null
  vehicle_label?: string | null
  customer_name?: string | null
  scheduled_start_time?: string | null
}

export interface ApiPlateScanFrame {
  id: string
  upload_id?: string | null
  url: string
  captured_at?: string | null
  width?: number | null
  height?: number | null
}

export interface ApiPlateScan {
  id: string
  garage_id: string
  status: PlateScanStatus
  detected_plate?: string | null
  /** Điểm khớp cao nhất (0-1). */
  best_confidence?: number | null
  /** Booking khớp nhất sau khi BE xử lý. */
  matched_booking_id?: string | null
  captured_at?: string
  reviewed_at?: string | null
  reviewed_by_id?: string | null
  notes?: string | null
  candidates?: ApiPlateScanCandidate[]
  frames?: ApiPlateScanFrame[]
}

export interface ApiArrivalQueueItem {
  scan_id: string
  detected_plate?: string | null
  best_confidence?: number | null
  captured_at?: string
  matched_booking_id?: string | null
  matched_booking_code?: string | null
  scheduled_start_time?: string | null
}

export interface ApiPlateScanListParams {
  page?: number
  limit?: number
  status?: PlateScanStatus
  from?: string
  to?: string
}

export interface ApiRecognizePlatePayload {
  /** Frame URL BE sẽ tải về để nhận diện (BE có thể nhận upload_id hoặc URL). */
  frame_upload_id?: string
  frame_url?: string
  /** Nhận batch nhiều frame cùng lúc. */
  frame_upload_ids?: string[]
}

export interface ApiRetryPlateScanPayload {
  frame_upload_ids: string[]
  note?: string
}

export interface ApiConfirmPlateScanPayload {
  booking_id: string
  candidate_id?: string
  note?: string
}

export interface ApiRejectPlateScanPayload {
  reason: string
}

export interface ApiAlternateVehiclePayload {
  vehicle_id: string
  reason: string
}