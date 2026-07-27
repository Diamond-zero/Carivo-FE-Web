/**
 * Helpers để render phần "Trước → Sau" của audit log một cách tường minh
 * thay vì JSON thô. BE sửa chữa giá trị nhiều chỗ — chúng ta dịch sang tiếng
 * Việt thân thiện với người dùng dựa trên `resource_type` + các trường con.
 */

import { STAFF_TYPE_LABELS } from '../constants/staffType'
import type { StaffType } from '../types/staffProfile'

export interface AuditFieldChange {
  /** Khóa hiển thị bằng tiếng Việt */
  label: string
  /** Icon tuỳ chọn cho dòng (do caller truyền) */
  icon?: string
  /** Giá trị cũ (đã được chuẩn hoá) */
  before: AuditValue | null
  /** Giá trị mới (đã được chuẩn hoá) */
  after: AuditValue | null
  /** Gợi ý trình bày: 'swap' = swap badge, 'note' = dòng chú thích */
  presentation?: 'swap' | 'note'
}

export type AuditValue =
  | string
  | number
  | boolean
  | null
  | { display: string; meta?: Record<string, unknown> }

const STAFF_TYPE_SET = new Set<string>(Object.keys(STAFF_TYPE_LABELS))

/** Bỏ dấu trắng 2 đầu, fallback chuỗi rỗng */
function trim(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  return ''
}

function asString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  return null
}

/** Rút id từ một object BE trả về (Mongo doc hoặc plain) */
function extractId(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return asString(value)
  if (typeof value !== 'object') return asString(value)
  const obj = value as Record<string, unknown>
  return (
    asString(obj._id) ??
    asString(obj.id) ??
    asString(obj.garage_id) ??
    asString(obj.staff_profile_id) ??
    asString(obj.user_id)
  )
}

function extractStaffType(value: unknown): string | null {
  const text = asString(value)
  if (!text) return null
  const upper = text.toUpperCase()
  if (STAFF_TYPE_SET.has(upper)) return upper
  return null
}

function extractStatus(value: unknown): string | null {
  const text = asString(value)
  if (!text) return null
  return text.toUpperCase()
}

/**
 * Trả về label tiếng Việt cho một staff_type, fallback trả nguyên text.
 */
export function getStaffTypeLabel(value: unknown): string {
  const code = extractStaffType(value)
  if (!code) return trim(value) || '—'
  return STAFF_TYPE_LABELS[code as StaffType] ?? code
}

export function getStatusLabel(value: unknown): string {
  const text = extractStatus(value)
  if (!text) return '—'
  return text
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())
}

export function getBooleanLabel(value: unknown): string {
  if (value === true) return 'Bật'
  if (value === false) return 'Tắt'
  return '—'
}

function formatDate(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toLocaleString('vi-VN')
  if (typeof value === 'string') {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime()))
      return date.toLocaleString('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    return value
  }
  return null
}

/** Tóm tắt rút từ "after" + "before" của STAFF_TYPE_CHANGE_REQUEST_APPLIED */
function describeStaffTypeChangeApplied(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): AuditFieldChange[] {
  const result: AuditFieldChange[] = []
  if (!before && !after) return result

  const fromType = extractStaffType(before?.staff_type ?? before?.from_staff_type)
  const toType = extractStaffType(after?.staff_type ?? after?.to_staff_type)
  if (fromType || toType) {
    result.push({
      label: 'Loại chức năng',
      icon: 'shield',
      before: fromType ? getStaffTypeLabel(fromType) : null,
      after: toType ? getStaffTypeLabel(toType) : null,
      presentation: 'swap',
    })
  }

  const fromGarage = extractId(before?.garage_id)
  const toGarage = extractId(after?.garage_id)
  if (fromGarage || toGarage) {
    result.push({
      label: 'Garage làm việc',
      icon: 'building',
      before: fromGarage ? { display: fromGarage } : null,
      after: toGarage ? { display: toGarage } : null,
      presentation: 'swap',
    })
  }

  return result
}

/** Tóm tắt rút từ "after" của STAFF_TYPE_CHANGE_REQUEST_<*> */
function describeStaffTypeChangeRequest(
  after: Record<string, unknown> | null,
): AuditFieldChange[] {
  if (!after) return []
  const result: AuditFieldChange[] = []

  const fromType = extractStaffType(after.from_staff_type)
  const toType = extractStaffType(after.to_staff_type)
  if (fromType || toType) {
    result.push({
      label: 'Loại chức năng',
      icon: 'shield',
      before: fromType ? getStaffTypeLabel(fromType) : null,
      after: toType ? getStaffTypeLabel(toType) : null,
      presentation: 'swap',
    })
  }

  const effectiveAt = formatDate(after.effective_at)
  if (effectiveAt) {
    result.push({
      label: 'Thời điểm áp dụng',
      icon: 'calendar',
      before: null,
      after: effectiveAt,
    })
  }

  const status = getStatusLabel(after.status)
  if (status !== '—') {
    result.push({
      label: 'Trạng thái yêu cầu',
      icon: 'flag',
      before: null,
      after: status,
    })
  }

  const reason = asString(after.reason) ?? asString(after.decision_reason)
  if (reason) {
    result.push({
      label: 'Lý do',
      icon: 'note',
      before: null,
      after: reason,
    })
  }

  return result
}

/** Tóm tắt rút từ "before"/"after" của resource BOOKING */
function describeBookingChange(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): AuditFieldChange[] {
  const result: AuditFieldChange[] = []
  const getStatus = (v: unknown) => getStatusLabel(v)

  const bStatus = extractStatus(before?.status)
  const aStatus = extractStatus(after?.status)
  if (bStatus || aStatus) {
    result.push({
      label: 'Trạng thái booking',
      before: bStatus ? getStatus(bStatus) : null,
      after: aStatus ? getStatus(aStatus) : null,
    })
  }

  const bReason = asString(before?.cancel_reason) ?? asString(before?.reason)
  const aReason = asString(after?.cancel_reason) ?? asString(after?.reason)
  if (bReason || aReason) {
    result.push({
      label: 'Lý do',
      before: bReason ?? null,
      after: aReason ?? null,
    })
  }

  const bGarage = extractId(before?.garage_id)
  const aGarage = extractId(after?.garage_id)
  if (bGarage || aGarage) {
    result.push({
      label: 'Garage',
      before: bGarage ? { display: bGarage } : null,
      after: aGarage ? { display: aGarage } : null,
    })
  }

  const bTime = formatDate(before?.scheduled_at) ?? formatDate(before?.start_at)
  const aTime = formatDate(after?.scheduled_at) ?? formatDate(after?.start_at)
  if (bTime || aTime) {
    result.push({
      label: 'Thời gian hẹn',
      before: bTime,
      after: aTime,
    })
  }

  // Camera event / arrival detection: CAMERA_DEVICE_EVENT_INGESTED
  const bArrival = formatDate(before?.arrival_detected_at)
  const aArrival = formatDate(after?.arrival_detected_at)
  if (bArrival || aArrival) {
    result.push({
      label: 'Thời điểm phát hiện xe',
      before: bArrival,
      after: aArrival,
    })
  }

  const bScanId =
    extractId(before?.arrival_detection_scan_id) ??
    extractId(before?.plate_scan_id)
  const aScanId =
    extractId(after?.arrival_detection_scan_id) ??
    extractId(after?.plate_scan_id)
  if (bScanId || aScanId) {
    result.push({
      label: 'Lần quét biển số',
      before: bScanId ? { display: bScanId } : null,
      after: aScanId ? { display: aScanId } : null,
    })
  }

  return result
}

/** Mô tả resource = BOOKING_PLATE_SCAN */
function describePlateScanChange(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): AuditFieldChange[] {
  const result: AuditFieldChange[] = []

  const bPlate = asString(before?.raw_plate_text) ?? asString(before?.normalized_plate)
  const aPlate = asString(after?.raw_plate_text) ?? asString(after?.normalized_plate)
  if (bPlate || aPlate) {
    result.push({
      label: 'Biển số nhận diện',
      before: bPlate,
      after: aPlate,
    })
  }

  const bConfidence = before?.confidence
  const aConfidence = after?.confidence
  const confidenceStr = (v: unknown) =>
    typeof v === 'number' && v > 0 ? `${(v * 100).toFixed(1)}%` : null
  if (confidenceStr(bConfidence) || confidenceStr(aConfidence)) {
    result.push({
      label: 'Độ tin cậy',
      before: confidenceStr(bConfidence),
      after: confidenceStr(aConfidence),
    })
  }

  const bType = asString(before?.detected_vehicle_type)
  const aType = asString(after?.detected_vehicle_type)
  if (bType || aType) {
    result.push({
      label: 'Loại phương tiện nhận diện',
      before: bType,
      after: aType,
    })
  }

  const bBooking = extractId(before?.matched_booking_id) ?? extractId(before?.confirmed_booking_id)
  const aBooking = extractId(after?.matched_booking_id) ?? extractId(after?.confirmed_booking_id)
  if (bBooking || aBooking) {
    result.push({
      label: 'Booking khớp',
      before: bBooking ? { display: bBooking } : null,
      after: aBooking ? { display: aBooking } : null,
    })
  }

  const bGarage = extractId(before?.garage_id)
  const aGarage = extractId(after?.garage_id)
  if (bGarage || aGarage) {
    result.push({
      label: 'Garage',
      before: bGarage ? { display: bGarage } : null,
      after: aGarage ? { display: aGarage } : null,
    })
  }

  const aStatus = extractStatus(after?.status)
  if (aStatus) {
    result.push({
      label: 'Trạng thái quét',
      before: null,
      after: getStatusLabel(aStatus),
    })
  }

  const aSource = asString(after?.capture_source)
  if (aSource) {
    result.push({
      label: 'Nguồn chụp',
      before: null,
      after: aSource === 'CAMERA' ? 'Camera tự động' : aSource,
    })
  }

  const aMode = asString(after?.mode)
  if (aMode) {
    result.push({
      label: 'Chế độ',
      before: null,
      after: aMode === 'LIVE' ? 'Trực tiếp' : aMode === 'BATCH' ? 'Theo lô' : aMode,
    })
  }

  const aCapturedAt = formatDate(after?.captured_at)
  if (aCapturedAt) {
    result.push({
      label: 'Thời điểm chụp',
      before: null,
      after: aCapturedAt,
    })
  }

  const aExpiresAt = formatDate(after?.expires_at)
  if (aExpiresAt) {
    result.push({
      label: 'Thời điểm hết hạn',
      before: null,
      after: aExpiresAt,
    })
  }

  const aFailure = asString(after?.failure_message)
  if (aFailure) {
    result.push({
      label: 'Lý do',
      before: null,
      after: aFailure,
    })
  }

  return result
}

/**
 * Mô tả resource = UPLOAD — hình ảnh sẽ render riêng qua section "Hình ảnh",
 * phần diff này chỉ tóm tắt thay đổi chính (mục đích, dung lượng, kích thước).
 */
function describeUploadChange(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): AuditFieldChange[] {
  const result: AuditFieldChange[] = []

  const bPurpose = asString(before?.purpose)
  const aPurpose = asString(after?.purpose)
  if (bPurpose || aPurpose) {
    result.push({
      label: 'Mục đích',
      before: bPurpose ? translateUploadPurpose(bPurpose) : null,
      after: aPurpose ? translateUploadPurpose(aPurpose) : null,
    })
  }

  const bSize = typeof before?.size === 'number' ? before.size : null
  const aSize = typeof after?.size === 'number' ? after.size : null
  if (bSize !== null || aSize !== null) {
    result.push({
      label: 'Dung lượng',
      before: bSize !== null ? formatBytes(bSize) : null,
      after: aSize !== null ? formatBytes(aSize) : null,
    })
  }

  const bWidth = typeof before?.width === 'number' ? before.width : null
  const bHeight = typeof before?.height === 'number' ? before.height : null
  const aWidth = typeof after?.width === 'number' ? after.width : null
  const aHeight = typeof after?.height === 'number' ? after.height : null
  const bDim = bWidth && bHeight ? `${bWidth} × ${bHeight}` : null
  const aDim = aWidth && aHeight ? `${aWidth} × ${aHeight}` : null
  if (bDim || aDim) {
    result.push({
      label: 'Kích thước',
      before: bDim,
      after: aDim,
    })
  }

  const bMime = asString(before?.mime_type)
  const aMime = asString(after?.mime_type)
  if (bMime || aMime) {
    result.push({
      label: 'Loại tệp',
      before: bMime,
      after: aMime,
    })
  }

  const bRelated = getRelatedSummary(before)
  const aRelated = getRelatedSummary(after)
  if (bRelated || aRelated) {
    result.push({
      label: 'Liên kết',
      before: bRelated,
      after: aRelated,
    })
  }

  return result
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function translateUploadPurpose(purpose: string): string {
  switch (purpose) {
    case 'VEHICLE_INSPECTION':
      return 'Kiểm tra xe (trước/sau rửa)'
    case 'BOOKING_PLATE_SCAN':
      return 'Quét biển số booking'
    case 'CUSTOMER_CASE_EVIDENCE':
      return 'Bằng chứng khiếu nại'
    case 'SURVEY_RESPONSE':
      return 'Phản hồi khảo sát'
    case 'RESEARCH_ATTACHMENT':
      return 'Tệp đính kèm nghiên cứu'
    case 'USER_AVATAR':
      return 'Ảnh đại diện'
    case 'GENERAL':
      return 'Tệp chung'
    default:
      return purpose
  }
}

function getRelatedSummary(
  value: Record<string, unknown> | null,
): string | null {
  if (!value) return null
  const relatedType = asString(value.related_type)
  const relatedId = asString(value.related_id)
  if (!relatedType && !relatedId) return null
  const parts: string[] = []
  if (relatedType) parts.push(translateUploadRelatedType(relatedType))
  if (relatedId) parts.push(`#${relatedId.slice(-6).toUpperCase()}`)
  return parts.join(' · ')
}

function translateUploadRelatedType(value: string): string {
  switch (value) {
    case 'BOOKING':
      return 'Booking'
    case 'VEHICLE':
      return 'Phương tiện'
    case 'VEHICLE_INSPECTION':
      return 'Lần kiểm tra xe'
    case 'SURVEY':
      return 'Khảo sát'
    case 'SURVEY_RESPONSE':
      return 'Phản hồi khảo sát'
    case 'CUSTOMER_CASE':
      return 'Khiếu nại'
    case 'RESEARCH_REPORT':
      return 'Báo cáo nghiên cứu'
    case 'WASH_HISTORY':
      return 'Lịch sử rửa'
    case 'GARAGE':
      return 'Garage'
    case 'SERVICE_PACKAGE':
      return 'Gói dịch vụ'
    case 'BOOKING_PLATE_SCAN':
      return 'Lần quét biển số'
    case 'USER':
      return 'Người dùng'
    default:
      return value
  }
}

/** Mô tả resource = BOOKING_HANDOVER */
function describeBookingHandoverChange(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): AuditFieldChange[] {
  const result: AuditFieldChange[] = []

  const bState = extractStatus(before?.state)
  const aState = extractStatus(after?.state)
  if (bState || aState) {
    result.push({
      label: 'Trạng thái phiên',
      before: bState ? getStatusLabel(bState) : null,
      after: aState ? getStatusLabel(aState) : null,
    })
  }

  const bResp = extractStatus(before?.customer_response)
  const aResp = extractStatus(after?.customer_response)
  if (bResp || aResp) {
    result.push({
      label: 'Phản hồi khách hàng',
      before: bResp ? getStatusLabel(bResp) : null,
      after: aResp ? getStatusLabel(aResp) : null,
    })
  }

  const aReadyAt = formatDate(after?.ready_at)
  if (aReadyAt) {
    result.push({
      label: 'Thời điểm sẵn sàng',
      before: null,
      after: aReadyAt,
    })
  }

  const aReadyNote = asString(after?.ready_note)
  if (aReadyNote) {
    result.push({
      label: 'Ghi chú sẵn sàng',
      before: null,
      after: aReadyNote,
    })
  }

  return result
}

/**
 * Trích xuất danh sách ảnh (image_url) từ `inspection_snapshot` của
 * BOOKING_HANDOVER để hiển thị ảnh trước/sau khi rửa.
 *
 * Shape: `{ before: { images: [...] }, after: { images: [...] } }`
 */
export interface AuditImage {
  url: string
  caption?: string | null
  type: 'BEFORE_WASH' | 'AFTER_WASH' | 'OTHER'
}

export function extractInspectionImages(
  after: Record<string, unknown> | null,
): { before: AuditImage[]; after: AuditImage[] } {
  const empty = { before: [] as AuditImage[], after: [] as AuditImage[] }
  if (!after) return empty
  const snapshot = after.inspection_snapshot
  if (!snapshot || typeof snapshot !== 'object') return empty

  const obj = snapshot as Record<string, unknown>
  const beforeBlock = obj.before as Record<string, unknown> | undefined
  const afterBlock = obj.after as Record<string, unknown> | undefined

  const mapImages = (block: Record<string, unknown> | undefined) => {
    if (!block) return [] as AuditImage[]
    const images = block.images
    if (!Array.isArray(images)) return [] as AuditImage[]
    const type = (block.type as string) === 'BEFORE_WASH'
      ? 'BEFORE_WASH'
      : (block.type as string) === 'AFTER_WASH'
        ? 'AFTER_WASH'
        : 'OTHER'
    return images
      .filter(
        (img): img is { image_url: string; caption?: string } =>
          !!img &&
          typeof img === 'object' &&
          typeof (img as { image_url?: unknown }).image_url === 'string',
      )
      .map((img) => ({
        url: img.image_url,
        caption: img.caption ?? null,
        type: type as AuditImage['type'],
      }))
  }

  return {
    before: mapImages(beforeBlock),
    after: mapImages(afterBlock),
  }
}

/**
 * Tìm ảnh trong `before`/`after` tổng quát (khi BE lưu cả mảng ảnh
 * trực tiếp trong audit before/after payload).
 */
export function extractAuditImages(
  value: Record<string, unknown> | null,
): AuditImage[] {
  if (!value) return []
  const items: AuditImage[] = []
  for (const key of [
    'images',
    'before_images',
    'after_images',
    'inspection_images',
  ]) {
    const arr = value[key]
    if (!Array.isArray(arr)) continue
    for (const img of arr) {
      if (img && typeof img === 'object' && 'image_url' in img) {
        items.push({
          url: (img as { image_url: string }).image_url,
          caption: (img as { caption?: string }).caption ?? null,
          type: key.includes('after') ? 'AFTER_WASH' : 'BEFORE_WASH',
        })
      }
    }
  }
  return items
}

/**
 * Trích xuất 1 ảnh đơn từ URL trực tiếp trong before/after (cho UPLOAD resource).
 */
export function extractUploadImageUrl(
  value: Record<string, unknown> | null,
): { url: string | null; mimeType: string | null; caption: string | null } {
  if (!value) return { url: null, mimeType: null, caption: null }
  const url = asString(value.url)
  const mimeType = asString(value.mime_type)
  const caption = asString(value.caption)
  return { url, mimeType, caption }
}

/**
 * Trích xuất hình ảnh từ `plate_crop_url` + `frames[]` của
 * BOOKING_PLATE_SCAN resource.
 */
export interface PlateScanImage {
  url: string
  kind: 'crop' | 'frame'
  caption?: string | null
}

export function extractPlateScanImages(
  value: Record<string, unknown> | null,
): PlateScanImage[] {
  if (!value) return []
  const items: PlateScanImage[] = []
  const crop = asString(value.plate_crop_url)
  if (crop) {
    items.push({ url: crop, kind: 'crop', caption: 'Ảnh cắt biển số' })
  }
  const frames = value.frames
  if (Array.isArray(frames)) {
    for (const frame of frames) {
      if (
        frame &&
        typeof frame === 'object' &&
        typeof (frame as { url?: unknown }).url === 'string'
      ) {
        const url = (frame as { url: string }).url
        items.push({
          url,
          kind: 'frame',
          caption: asString((frame as { caption?: unknown }).caption) ?? null,
        })
      }
    }
  }
  return items
}

/** Mô tả resource = GARAGE (admin đổi garage) */
function describeGarageChange(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): AuditFieldChange[] {
  const result: AuditFieldChange[] = []
  const getName = (v: unknown) => {
    if (!v || typeof v !== 'object') return asString(v)
    const obj = v as Record<string, unknown>
    return (
      asString(obj.name) ??
      asString(obj.garage_code) ??
      extractId(v)
    )
  }
  const bName = getName(before?.name) ?? extractId(before)
  const aName = getName(after?.name) ?? extractId(after)
  if (bName || aName) {
    result.push({
      label: 'Tên garage',
      before: bName ?? null,
      after: aName ?? null,
    })
  }

  const bActive = before?.is_active
  const aActive = after?.is_active
  if (typeof bActive === 'boolean' || typeof aActive === 'boolean') {
    result.push({
      label: 'Trạng thái hoạt động',
      before: getBooleanLabel(bActive),
      after: getBooleanLabel(aActive),
    })
  }

  const bCity = asString(before?.city)
  const aCity = asString(after?.city)
  if (bCity || aCity) {
    result.push({
      label: 'Thành phố',
      before: bCity,
      after: aCity,
    })
  }

  const bPhone = asString(before?.phone)
  const aPhone = asString(after?.phone)
  if (bPhone || aPhone) {
    result.push({
      label: 'Số điện thoại',
      before: bPhone,
      after: aPhone,
    })
  }

  return result
}

/** Mô tả resource = STAFF_PROFILE (đổi mã / garage của staff) */
function describeStaffProfileChange(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): AuditFieldChange[] {
  const result: AuditFieldChange[] = []
  const bGarage = extractId(before?.garage_id)
  const aGarage = extractId(after?.garage_id)
  if (bGarage || aGarage) {
    result.push({
      label: 'Garage làm việc',
      before: bGarage ? { display: bGarage } : null,
      after: aGarage ? { display: aGarage } : null,
    })
  }
  const bCode = asString(before?.staff_code)
  const aCode = asString(after?.staff_code)
  if (bCode || aCode) {
    result.push({
      label: 'Mã nhân viên',
      before: bCode,
      after: aCode,
    })
  }
  const bActive = before?.is_active
  const aActive = after?.is_active
  if (typeof bActive === 'boolean' || typeof aActive === 'boolean') {
    result.push({
      label: 'Trạng thái hoạt động',
      before: getBooleanLabel(bActive),
      after: getBooleanLabel(aActive),
    })
  }
  return result
}

/** Mô tả resource = USER */
function describeUserChange(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): AuditFieldChange[] {
  const result: AuditFieldChange[] = []
  const bActive = before?.is_active
  const aActive = after?.is_active
  if (typeof bActive === 'boolean' || typeof aActive === 'boolean') {
    result.push({
      label: 'Trạng thái hoạt động',
      before: getBooleanLabel(bActive),
      after: getBooleanLabel(aActive),
    })
  }
  const bRole = asString(before?.role)
  const aRole = asString(after?.role)
  if (bRole || aRole) {
    result.push({
      label: 'Vai trò',
      before: bRole,
      after: aRole,
    })
  }
  const bName = asString(before?.full_name)
  const aName = asString(after?.full_name)
  if (bName || aName) {
    result.push({
      label: 'Họ và tên',
      before: bName,
      after: aName,
    })
  }
  return result
}

/** Mô tả resource = SERVICE_PACKAGE / PROMOTION / TIER_RULE */
function describeGenericValueChange(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): AuditFieldChange[] {
  const result: AuditFieldChange[] = []
  const pairs: Array<[string, (v: unknown) => string | null]> = [
    ['Mô tả', (v) => asString(v)],
    ['Trạng thái', (v) => getStatusLabel(v)],
    [
      'Trạng thái hoạt động',
      (v) => (typeof v === 'boolean' ? getBooleanLabel(v) : null),
    ],
    ['Từ ngày', (v) => formatDate(v)],
    ['Đến ngày', (v) => formatDate(v)],
  ]
  for (const [label, format] of pairs) {
    const b = before?.[labelToKey(label)]
    const a = after?.[labelToKey(label)]
    const fb = format(b)
    const fa = format(a)
    if (fb || fa) {
      result.push({ label, before: fb, after: fa })
    }
  }
  return result
}

function labelToKey(label: string): string {
  switch (label) {
    case 'Mô tả':
      return 'description'
    case 'Trạng thái':
      return 'status'
    case 'Trạng thái hoạt động':
      return 'is_active'
    case 'Từ ngày':
      return 'start_at'
    case 'Đến ngày':
      return 'end_at'
    default:
      return label
  }
}

/**
 * Kiểm tra 1 audit value có "rỗng" hay không
 * (null, undefined, chuỗi rỗng, mảng rỗng, object không có key, 0).
 */
function isEmptyAuditValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (typeof value === 'number') return false
  if (typeof value === 'boolean') return false
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object' && value !== null && 'display' in value) {
    const display = (value as { display: unknown }).display
    return (
      display === null ||
      display === undefined ||
      (typeof display === 'string' && display.trim().length === 0)
    )
  }
  if (typeof value === 'object') {
    return Object.keys(value as object).length === 0
  }
  return false
}

/**
 * Lọc ra những dòng thay đổi mà cả 2 phía Trước/Sau đều rỗng —
 * tránh hiển thị các dòng `—` không mang thông tin.
 */
function filterMeaningfulChanges(
  changes: AuditFieldChange[],
): AuditFieldChange[] {
  return changes.filter(
    (change) =>
      !isEmptyAuditValue(change.before) ||
      !isEmptyAuditValue(change.after),
  )
}

/** Trả về tiêu đề tường minh cho nhóm "Trước → Sau" theo resource + action */
export function describeAuditChange(
  resourceType: string,
  action: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): { title: string; changes: AuditFieldChange[] } {
  const upperAction = action.toUpperCase()
  const upperResource = resourceType.toUpperCase()

  // Staff type change
  if (
    upperResource === 'STAFF_TYPE_CHANGE_REQUEST' ||
    upperResource === 'STAFF_TYPE_CHANGE'
  ) {
    if (upperAction === 'STAFF_TYPE_CHANGE_APPLIED') {
      return {
        title: 'Ghi nhận thay đổi chức năng trên hồ sơ nhân viên',
        changes: filterMeaningfulChanges(
          describeStaffTypeChangeApplied(before, after),
        ),
      }
    }
    return {
      title: 'Nội dung yêu cầu đổi chức năng',
      changes: filterMeaningfulChanges(describeStaffTypeChangeRequest(after)),
    }
  }

  switch (upperResource) {
    case 'GARAGE':
      return {
        title: 'Thay đổi thông tin garage',
        changes: filterMeaningfulChanges(describeGarageChange(before, after)),
      }
    case 'BOOKING':
      return {
        title: 'Thay đổi trên booking',
        changes: filterMeaningfulChanges(describeBookingChange(before, after)),
      }
    case 'BOOKING_PLATE_SCAN':
      return {
        title: 'Ghi nhận quét biển số',
        changes: filterMeaningfulChanges(describePlateScanChange(before, after)),
      }
    case 'BOOKING_HANDOVER':
      return {
        title: 'Thay đổi trên phiên bàn giao',
        changes: filterMeaningfulChanges(
          describeBookingHandoverChange(before, after),
        ),
      }
    case 'STAFF_PROFILE':
      return {
        title: 'Thay đổi trên hồ sơ nhân viên',
        changes: filterMeaningfulChanges(
          describeStaffProfileChange(before, after),
        ),
      }
    case 'USER':
      return {
        title: 'Thay đổi thông tin người dùng',
        changes: filterMeaningfulChanges(describeUserChange(before, after)),
      }
    case 'SERVICE_PACKAGE':
      return {
        title: 'Thay đổi trên gói dịch vụ',
        changes: filterMeaningfulChanges(
          describeGenericValueChange(before, after),
        ),
      }
    case 'PROMOTION':
      return {
        title: 'Thay đổi trên khuyến mãi',
        changes: filterMeaningfulChanges(
          describeGenericValueChange(before, after),
        ),
      }
    case 'TIER_RULE':
      return {
        title: 'Thay đổi trên quy tắc hạng',
        changes: filterMeaningfulChanges(
          describeGenericValueChange(before, after),
        ),
      }
    case 'UPLOAD':
      // UPLOAD audit: tóm tắt ngắn gọn, hình ảnh render riêng qua "Hình ảnh"
      return {
        title: 'Thay đổi trên tệp đính kèm',
        changes: filterMeaningfulChanges(describeUploadChange(before, after)),
      }
    default:
      return {
        title: 'Thay đổi thuộc tính',
        changes: filterMeaningfulChanges(
          describeGenericValueChange(before, after),
        ),
      }
  }
}

/** Trình bày metadata theo dạng key/value dễ đọc */
export interface AuditMetadataEntry {
  label: string
  value: string
  tone?: 'default' | 'info' | 'warning' | 'success' | 'danger'
}

const METADATA_LABELS: Record<string, string> = {
  staff_profile_id: 'Hồ sơ nhân viên',
  from_staff_type: 'Từ chức năng',
  to_staff_type: 'Đến chức năng',
  to_garage_id: 'Garage đích',
  from_garage_id: 'Garage nguồn',
  effective_at: 'Áp dụng lúc',
  applied_at: 'Thời điểm áp dụng',
  scanned_at: 'Thời điểm quét',
  request_source: 'Nguồn yêu cầu',
  requested_by_role: 'Vai trò yêu cầu',
  reason: 'Lý do',
  decision_reason: 'Lý do quyết định',
  booking_id: 'Booking liên quan',
  customer_id: 'Khách hàng',
  vehicle_id: 'Phương tiện',
  garage_id: 'Garage liên quan',
  staff_id: 'Nhân viên',
  user_id: 'Người dùng',
  wash_bay_id: 'Buồng rửa',
  service_package_id: 'Gói dịch vụ',
  promotion_id: 'Khuyến mãi',
  override_reason: 'Lý do vượt quyền',
  emergency_override: 'Áp dụng khẩn cấp',
  ip: 'IP',
  user_agent: 'Trình duyệt',
  source: 'Nguồn',
  action_type: 'Loại hành động',
  status: 'Trạng thái',
  note: 'Ghi chú',
  scheduler: 'Trình lập lịch',
  triggered_by: 'Nguồn kích hoạt',
  future_assignment_count: 'Số lịch hẹn sắp tới',
}

const METADATA_TONE: Record<string, AuditMetadataEntry['tone']> = {
  effective_at: 'info',
  request_source: 'warning',
  emergency_override: 'danger',
}

function formatMetadataValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }
  if (typeof value === 'boolean') {
    if (key === 'emergency_override') return value ? 'Có' : 'Không'
    return getBooleanLabel(value)
  }
  if (typeof value === 'number') {
    if (key === 'future_assignment_count') {
      return value === 0 ? 'Không có' : `${value} lịch`
    }
    return String(value)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return '—'
    if (key === 'from_staff_type' || key === 'to_staff_type') {
      return getStaffTypeLabel(trimmed)
    }
    if (key === 'from_garage_id' || key === 'to_garage_id') {
      return trimmed
    }
    if (key === 'request_source') {
      if (trimmed === 'STAFF_SELF_REQUEST') return 'Staff tự đề xuất'
      if (trimmed === 'ADMIN_DIRECTED') return 'Admin điều chỉnh'
      return trimmed
    }
    if (key === 'requested_by_role') {
      if (trimmed === 'ADMIN') return 'Quản trị viên'
      if (trimmed === 'STAFF') return 'Nhân viên'
      return trimmed
    }
    if (key === 'effective_at' || key === 'applied_at' || key === 'scanned_at') {
      const date = new Date(trimmed)
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString('vi-VN', {
          dateStyle: 'short',
          timeStyle: 'short',
        })
      }
    }
    if (key === 'scheduler') {
      if (trimmed === 'cron') return 'Tự động theo lịch (cron)'
      if (trimmed === 'manual') return 'Thủ công'
      return trimmed
    }
    if (key === 'triggered_by') {
      if (trimmed === 'system') return 'Hệ thống'
      return trimmed
    }
    if (key === 'purpose') {
      return translateUploadPurpose(trimmed)
    }
    if (key === 'response_source') {
      if (trimmed === 'STAFF') return 'Qua staff'
      if (trimmed === 'CUSTOMER') return 'Từ khách hàng'
      if (trimmed === 'SYSTEM') return 'Tự động'
      return trimmed
    }
    if (key === 'auto_check_in') {
      return trimmed === 'true' ? 'Có' : 'Không'
    }
    if (key === 'related_type') {
      return translateUploadRelatedType(trimmed)
    }
    return trimmed
  }
  return JSON.stringify(value)
}

export function describeAuditMetadata(
  metadata: Record<string, unknown> | null | undefined,
): AuditMetadataEntry[] {
  if (!metadata) return []
  const entries: AuditMetadataEntry[] = []
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) continue
    if (typeof value === 'object') continue
    const formatted = formatMetadataValue(key, value)
    if (!formatted || formatted === '—') continue
    entries.push({
      label: METADATA_LABELS[key] ?? key,
      value: formatted,
      tone: METADATA_TONE[key] ?? 'default',
    })
  }
  return entries
}

/** Tạo dòng tóm tắt hành động ngắn gọn */
export function describeAuditSummary(
  resourceType: string,
  action: string,
): string {
  const upperResource = resourceType.toUpperCase()
  const upperAction = action.toUpperCase()

  if (upperResource === 'STAFF_TYPE_CHANGE_REQUEST') {
    if (upperAction === 'STAFF_TYPE_CHANGE_REQUESTED')
      return 'Tạo yêu cầu đổi chức năng nhân viên'
    if (upperAction === 'STAFF_TYPE_CHANGE_APPROVED')
      return 'Phê duyệt yêu cầu đổi chức năng'
    if (upperAction === 'STAFF_TYPE_CHANGE_REJECTED')
      return 'Từ chối yêu cầu đổi chức năng'
    if (upperAction === 'STAFF_TYPE_CHANGE_APPLIED')
      return 'Áp dụng đổi chức năng lên hồ sơ'
    if (upperAction === 'STAFF_TYPE_CHANGE_CANCELLED')
      return 'Huỷ yêu cầu đổi chức năng'
    if (upperAction === 'STAFF_TYPE_CHANGE_FAILED')
      return 'Áp dụng đổi chức năng thất bại'
  }

  return humanizeAction(resourceType, action)
}

function humanizeAction(resourceType: string, action: string): string {
  const upperResource = resourceType.toUpperCase()
  const upperAction = action.toUpperCase()

  // Một số action đặc biệt cho resource cụ thể
  if (upperAction.startsWith('STAFF_TYPE_CHANGE_')) return 'Cập nhật đổi chức năng'
  if (upperAction === 'LOGIN') return 'Đăng nhập hệ thống'
  if (upperAction === 'LOGOUT') return 'Đăng xuất hệ thống'
  if (upperAction === 'EXPORT') return 'Xuất dữ liệu'

  // Map theo action
  switch (upperAction) {
    case 'CREATE':
      return 'Tạo mới'
    case 'UPDATE':
      return 'Cập nhật'
    case 'DELETE':
      return 'Xoá'
    case 'SOFT_DELETE':
      return 'Xoá mềm'
    case 'RESTORE':
      return 'Khôi phục'
    case 'TOGGLE_STATUS':
      return 'Đổi trạng thái'
    case 'APPROVE':
      return 'Phê duyệt'
    case 'REJECT':
      return 'Từ chối'
    case 'CANCEL':
      return 'Huỷ'
    case 'ASSIGN':
      return 'Phân công'
    case 'REASSIGN':
      return 'Phân công lại'
    case 'CLAIM':
      return 'Nhận xử lý'
    case 'RELEASE':
      return 'Nhả xử lý'
  }

  // Fallback theo resource
  switch (upperResource) {
    case 'GARAGE':
      return 'Cập nhật garage'
    case 'BOOKING':
      return 'Cập nhật booking'
    case 'STAFF_PROFILE':
      return 'Cập nhật hồ sơ nhân viên'
    case 'USER':
      return 'Cập nhật người dùng'
    case 'SERVICE_PACKAGE':
      return 'Cập nhật gói dịch vụ'
    case 'PROMOTION':
      return 'Cập nhật khuyến mãi'
  }

  return upperAction.replace(/_/g, ' ').toLowerCase()
}