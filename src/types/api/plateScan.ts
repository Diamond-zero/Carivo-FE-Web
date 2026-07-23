// ============================================================================
// Plate Scan — canonical types cho BE `bookingArrival.swagger.js` (2025-07).
// Khớp 1-1 với:
//   - PLATE_SCAN_STATUS_VALUES  (bookingArrival.constant.js)
//   - PLATE_SCAN_MODE_VALUES    (bookingArrival.constant.js)
//   - PLATE_CAPTURE_SOURCE_VALUES (bookingArrival.constant.js)
//   - PLATE_MATCH_TYPE_VALUES   (bookingArrival.constant.js)
//   - PLATE_QUALITY_FLAG_VALUES (bookingArrival.constant.js)
//   - PLATE_SCAN_REJECTION_REASON_VALUES (bookingArrival.constant.js)
//   - ALTERNATE_VEHICLE_STATUS_VALUES (bookingArrival.constant.js)
//   - VEHICLE_TYPE_VALUES       (vehicle.constant.js) → 'CAR' | 'MOTORBIKE'
//   - CAMERA_DEVICE_STATUS_VALUES / health_status computed (bookingArrival.mapper.js)
// ============================================================================

// ----- Enums (literal unions theo canonical values) -----------------------

/** Trạng thái scan — full lifecycle, terminal = CONFIRMED | REJECTED | EXPIRED. */
export type PlateScanStatus =
  | 'CAPTURED'
  | 'RECOGNIZING'
  | 'QUALITY_REJECTED'
  | 'EXACT_MATCH'
  | 'FUZZY_CANDIDATES'
  | 'AMBIGUOUS'
  | 'NO_MATCH'
  | 'MULTIPLE_PLATES'
  | 'ARRIVAL_DETECTED'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'FAILED'

/** Scan mode — SINGLE/LIVE_BATCH do staff tạo, GATE do camera cổng tự đẩy. */
export type PlateScanMode = 'SINGLE' | 'LIVE_BATCH' | 'GATE'

/** Nguồn capture. Staff chỉ dùng STAFF_CAMERA | GALLERY | LIVE_CAMERA; các giá trị
 * còn lại là dành cho camera cổng / ingestion nền. */
export type PlateCaptureSource =
  | 'STAFF_CAMERA'
  | 'GALLERY'
  | 'LIVE_CAMERA'
  | 'GATE_CAMERA'
  | 'OFFLINE_GATE'

/** Kiểu match mà BE gắn lên booking khi confirm. */
export type PlateMatchType = 'EXACT' | 'FUZZY' | 'MANUAL' | 'NONE'

/** Quality flag — các cờ ảnh hưởng recognition. */
export type PlateQualityFlag =
  | 'BLUR'
  | 'GLARE'
  | 'TOO_DARK'
  | 'TOO_FAR'
  | 'BAD_ANGLE'
  | 'PLATE_CROPPED'
  | 'MULTIPLE_PLATES'
  | 'NO_PLATE_DETECTED'
  | 'IMAGE_TOO_SMALL'
  | 'FILE_TOO_SMALL'

/** Enum lý do reject scan — staff chọn khi từ chối. */
export type PlateScanRejectionReason =
  | 'VEHICLE_MISMATCH'
  | 'WRONG_BOOKING'
  | 'POOR_IMAGE'
  | 'CUSTOMER_NOT_PRESENT'
  | 'DUPLICATE_SCAN'
  | 'OTHER'

/** Trạng thái yêu cầu xe thay thế. NONE = không yêu cầu. */
export type AlternateVehicleStatus =
  | 'NONE'
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'

/** Loại xe khớp với BE `VEHICLE_TYPE_VALUES` (vehicle.constant.js). */
export type PlateScanVehicleType = 'CAR' | 'MOTORBIKE' | 'UNKNOWN'

/** Trạng thái camera cổng. */
export type CameraDeviceStatus =
  | 'ACTIVE'
  | 'MAINTENANCE'
  | 'INACTIVE'
  | 'REVOKED'

/** Health computed bởi BE `bookingArrival.mapper.js → getHealthStatus`. */
export type CameraDeviceHealthStatus =
  | 'ONLINE'
  | 'STALE'
  | 'OFFLINE'
  | 'DISABLED'

// ----- DTOs ---------------------------------------------------------------

/** 1 frame ảnh đã nhận diện — `scan.frame_results[]`. */
export interface ApiPlateScanFrame {
  id: string
  /** Upload id tương ứng trong bảng uploads. */
  upload_id: string | null
  /** URL hiển thị (Cloudinary secure_url). */
  url: string
  /** ISO 8601 thời điểm capture (client-side timestamp). */
  captured_at: string | null
  width: number | null
  height: number | null
}

/** Payload mà BE trả trong `candidate.booking` — DTO booking đầy đủ từ
 * `booking.mapper.js → toBookingDto`. FE có thể cast sang `ApiBooking`
 * (types/api/staff.ts) nếu cần thao tác sâu. */
export type ApiPlateScanCandidateBooking = Record<string, unknown> & {
  id: string
  license_plate?: string | null
  normalized_license_plate?: string | null
  start_time?: string | null
  vehicle_type?: PlateScanVehicleType
  customer_id?: string | null
  customer?: {
    id?: string
    full_name?: string | null
    phone?: string | null
  } | null
  vehicle?: {
    id?: string
    brand?: string | null
    model?: string | null
    color?: string | null
    license_plate?: string | null
  } | null
  status?: string
}

/** 1 candidate booking mà BE gợi ý khi scan. */
export interface ApiPlateScanCandidate {
  booking_id: string
  /** DTO booking đầy đủ (BE populate sẵn); null nếu không populate. */
  booking: ApiPlateScanCandidateBooking | null
  match_type: PlateMatchType
  /** Edit distance (0 cho EXACT). */
  edit_distance: number
  /** Khoảng cách từ scan.captured_at tới booking.start_time (phút). */
  scheduled_distance_minutes: number
  /** true nếu booking.vehicle_type không khớp với detected_vehicle_type. */
  vehicle_type_mismatch: boolean
}

/** DTO chi tiết của `BookingPlateScan` — trả về từ POST/GET
 * `/staff/booking-arrivals/plate-scans` và `/{scanId}`. */
export interface ApiPlateScan {
  id: string
  garage_id: string
  /** Staff tạo scan (null nếu gate-camera). */
  staff_id: string | null
  /** Camera device id (null nếu staff chụp). */
  camera_device_id: string | null
  /** Idempotent key cho offline gate ingestion. */
  client_event_id: string | null
  mode: PlateScanMode
  capture_source: PlateCaptureSource
  /** Client-side capture timestamp. */
  captured_at: string | null
  /** BE ghi nhận khi nhận request. */
  server_received_at: string | null
  status: PlateScanStatus
  /** Mảng upload_id (ObjectId) — đồng bộ với `frame_results[].upload_id`. */
  upload_ids: string[]
  /** Upload id mà BE đánh dấu là "primary frame" (kết quả nhận diện chính). */
  primary_upload_id: string | null
  /** Cloudinary non-destructive crop URL — null khi không crop được. */
  plate_crop_url: string | null
  /** Kết quả nhận diện trên từng frame (BE trả song song với upload_ids). */
  frame_results: ApiPlateScanFrame[]
  /** Plate text thô từ provider. */
  raw_plate_text: string | null
  /** Plate đã normalize (uppercase + bỏ dấu cách/dấu gạch). */
  normalized_plate: string | null
  /** Confidence tổng (0–1). */
  confidence: number
  /** Confidence theo từng ký tự. */
  character_confidences: number[]
  detected_vehicle_type: PlateScanVehicleType
  /** Mảng cờ chất lượng — render badge để staff biết lý do fuzzy/no-match. */
  quality_flags: PlateQualityFlag[]
  multiple_plate_count: number
  /** weather / time_of_day thu thập tại thời điểm capture (cho metrics). */
  weather: string | null
  time_of_day: string | null
  provider: string | null
  model_version: string | null
  processing_time_ms: number
  /** Nếu scan hiện tại là retry của scan khác — link tới scan gốc. */
  retry_of_scan_id: string | null
  retry_count: number
  /** Booking ứng viên — BE populate khi create/get. */
  candidates: ApiPlateScanCandidate[]
  /** Booking khớp nhất mà BE chọn tự động (null nếu FUZZY/AMBIGUOUS). */
  matched_booking_id: string | null
  match_type: PlateMatchType
  /** Booking đã confirm (chỉ có khi status = CONFIRMED). */
  confirmed_booking_id: string | null
  confirmed_by_id: string | null
  confirmed_at: string | null
  /** true khi staff tick "đã xác nhận vật lý". */
  staff_confirmed_vehicle: boolean
  manual_override: boolean
  override_reason: string | null
  rejection_reason: PlateScanRejectionReason | null
  rejection_note: string | null
  rejected_by_id: string | null
  rejected_at: string | null
  alternate_vehicle_status: AlternateVehicleStatus
  /** DTO chi tiết alternate vehicle (BE populate khi REQUESTED+). */
  alternate_vehicle: Record<string, unknown> | null
  failure_code: string | null
  failure_message: string | null
  /** Thời điểm BE purge ảnh Cloudinary (sau `PLATE_SCAN_RETENTION_DAYS`). */
  retain_until: string | null
  image_deleted_at: string | null
  /** Thời điểm BE auto-expire (sau `PLATE_SCAN_CONFIRM_EXPIRY_MINUTES`). */
  expires_at: string | null
  created_at: string | null
  updated_at: string | null
}

/** Item trong arrival queue (status = ARRIVAL_DETECTED từ gate camera). */
export type ApiArrivalQueueItem = ApiPlateScan

// ----- Camera device DTO ---------------------------------------------------

export interface ApiCameraDeviceMetadata {
  [key: string]: unknown
}

export interface ApiCameraDevice {
  id: string
  device_code: string
  name: string
  garage_id: string
  location: string | null
  status: CameraDeviceStatus
  health_status: CameraDeviceHealthStatus
  created_by_id: string | null
  rotated_by_id: string | null
  key_rotated_at: string | null
  last_heartbeat_at: string | null
  last_event_at: string | null
  firmware_version: string | null
  client_version: string | null
  metadata: ApiCameraDeviceMetadata
  /** BE chỉ trả về lúc create/rotate-key — staff phải copy ngay. */
  api_key?: string
  created_at: string | null
  updated_at: string | null
}

// ----- Metrics DTO ---------------------------------------------------------

/** Dimension breakdown trong metrics response. */
export interface ApiPlateScanMetricDimension {
  garage_id: string | null
  vehicle_type: PlateScanVehicleType
  weather: string | null
  time_of_day: string | null
  total: number
  confidence: number
  latency_ms: number
  confirmed: number
}

export interface ApiPlateScanStatusBucket {
  status: PlateScanStatus
  count: number
}

export interface ApiPlateScanQualityBucket {
  flag: PlateQualityFlag
  count: number
}

/** Response của `GET /admin/booking-arrivals/metrics`. */
export interface ApiPlateScanMetrics {
  total: number
  average_confidence: number
  average_latency_ms: number
  retries: number
  mismatches: number
  confirmed: number
  retry_rate: number
  mismatch_rate: number
  confirmation_rate: number
  by_status: ApiPlateScanStatusBucket[]
  quality_flags: ApiPlateScanQualityBucket[]
  dimensions: ApiPlateScanMetricDimension[]
}

// ----- Request payloads ----------------------------------------------------

/** Body `POST /staff/booking-arrivals/plate-scans`. */
export interface ApiCreatePlateScanPayload {
  garage_id: string
  /** 1 ảnh cho SINGLE, 2–5 ảnh cho LIVE_BATCH. BE refine. */
  upload_ids: string[]
  captured_at?: string
  mode?: 'SINGLE' | 'LIVE_BATCH'
  capture_source?: PlateCaptureSource
}

/** Body `POST /staff/booking-arrivals/plate-scans/:scanId/retry`. */
export interface ApiRetryPlateScanPayload {
  upload_ids: string[]
  captured_at?: string
  mode?: 'SINGLE' | 'LIVE_BATCH'
  capture_source?: PlateCaptureSource
}

/** Body `POST /staff/booking-arrivals/plate-scans/:scanId/confirm`. */
export interface ApiConfirmPlateScanPayload {
  booking_id: string
  note?: string
  /** Bắt buộc khi candidate.match_type !== 'EXACT' (FUZZY / MANUAL). Min 5 chars. */
  override_reason?: string
}

/** Body `POST /staff/booking-arrivals/plate-scans/:scanId/reject`. */
export interface ApiRejectPlateScanPayload {
  reason: PlateScanRejectionReason
  note?: string
}

/** Body `POST /staff/booking-arrivals/plate-scans/:scanId/alternate-vehicle`. */
export interface ApiRequestAlternateVehiclePayload {
  license_plate: string
  vehicle_type: 'CAR' | 'MOTORBIKE'
  brand?: string
  model?: string
  color?: string
  reason: string
}

/** Body `PATCH /admin/booking-arrivals/plate-scans/:scanId/alternate-vehicle`. */
export interface ApiReviewAlternateVehiclePayload {
  approved: boolean
  note: string
}

/** Body `POST /admin/booking-arrivals/camera-devices`. */
export interface ApiCreateCameraDevicePayload {
  device_code: string
  name: string
  garage_id: string
  location?: string
  metadata?: ApiCameraDeviceMetadata
}

/** Body `PATCH /admin/booking-arrivals/camera-devices/:id`. */
export interface ApiUpdateCameraDevicePayload {
  name?: string
  location?: string | null
  status?: CameraDeviceStatus
  metadata?: ApiCameraDeviceMetadata
}

// ----- Query params --------------------------------------------------------

export interface ApiPlateScanListParams {
  page?: number
  limit?: number
  garage_id?: string
  status?: PlateScanStatus
  from?: string
  to?: string
}

export interface ApiArrivalQueueParams {
  page?: number
  limit?: number
  garage_id?: string
  from?: string
  to?: string
}

export interface ApiCameraDeviceListParams {
  page?: number
  limit?: number
  garage_id?: string
  status?: CameraDeviceStatus
}

export interface ApiPlateScanMetricsParams {
  garage_id?: string
  from?: string
  to?: string
}

// ----- UI helpers ----------------------------------------------------------

export type PlateScanStatusVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
