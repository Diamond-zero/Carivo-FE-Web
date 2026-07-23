import axios, { type AxiosError } from 'axios'
import type { ApiValidationError } from '../types/api'
import { getAccessTokenForRequest } from '../lib/auth/tokenStorage'

const API_BASE_URL = `${import.meta.env.VITE_API_URL ?? 'https://wdp301-project-backend.onrender.com'}/api/v1`

export { API_BASE_URL }

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  // Chọn token dựa trên URL đang được gọi, tránh gửi admin token cho
  // staff route (hoặc ngược lại) khi cả hai đều đăng nhập cùng tab.
  const targetUrl = config.url ?? ''
  const token = getAccessTokenForRequest(targetUrl)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const API_ERROR_MESSAGES: Record<string, string> = {
  FORBIDDEN:
    'Tài khoản không có quyền thực hiện thao tác này. Vui lòng đăng xuất và đăng nhập lại bằng tài khoản nhân viên.',
  STAFF_GARAGE_ACCESS_DENIED:
    'Bạn không thể thao tác booking thuộc garage khác.',
  BOOKING_PENDING_PAYOS_PAYMENT:
    'Booking đang có link PayOS chờ thanh toán. Vui lòng hủy PayOS trước khi thu tiền mặt.',
  BOOKING_NOT_COMPLETED:
    'Chỉ booking đã hoàn thành dịch vụ mới được thanh toán.',
  BOOKING_ALREADY_PAID: 'Booking đã được thanh toán.',
  BOOKING_REOPEN_NOT_ALLOWED:
    'Booking đã được thu tiền hoặc đã cộng điểm — không thể reopen.',
  BOOKING_SERVICE_START_TOO_EARLY:
    'Chưa đến giờ bắt đầu dịch vụ. Vui lòng dùng "Chuyển sang bắt đầu ngay" nếu muốn làm sớm.',
  BOOKING_EARLY_START_NOT_ALLOWED:
    'Booking chưa check-in sớm — không thể bắt đầu sớm.',
  BOOKING_OUTSIDE_BUSINESS_HOURS:
    'Thời gian phục vụ vượt quá giờ hoạt động của garage.',
  WASH_BAY_NOT_AVAILABLE: 'Buồng rửa không khả dụng.',
  WASH_BAY_ALREADY_OCCUPIED: 'Buồng rửa đang bận.',
  LATE_RESOLUTION_NOT_ALLOWED:
    'Booking chưa được đánh dấu đến muộn — không thể xử lý đến trễ.',
  VEHICLE_BOOKING_OVERLAP:
    'Xe đã có booking khác trùng khung giờ này.',
  WASH_BAY_CAPACITY_FULL:
    'Không còn buồng rửa trống trong khung giờ này.',
  CARE_STAFF_CAPACITY_FULL:
    'Không đủ nhân viên chăm sóc trong khung giờ này.',
  SERVICE_PACKAGE_NOT_AVAILABLE:
    'Gói dịch vụ hiện không khả dụng.',
  PROMOTION_NOT_APPLICABLE:
    'Mã khuyến mãi không áp dụng được cho booking này.',
  PROMOTION_PHONE_REQUIRED:
    'Khuyến mãi yêu cầu nhập số điện thoại để xác minh.',
  POINTS_NOT_ENOUGH: 'Không đủ điểm để áp dụng.',
  RATE_LIMIT_EXCEEDED:
    'Bạn thao tác quá nhanh. Vui lòng đợi vài phút rồi thử lại.',
  USER_NOT_FOUND: 'Không tìm thấy người dùng này trên hệ thống.',
  EMAIL_OR_PHONE_EXISTS:
    'Email hoặc số điện thoại đã được sử dụng bởi tài khoản khác.',
  INVALID_ROLE:
    'Vai trò được chọn không hợp lệ. Vui lòng liên hệ quản trị viên.',
  CANNOT_DEACTIVATE_SELF:
    'Bạn không thể tự khóa tài khoản đang đăng nhập.',
  CANNOT_DELETE_SELF:
    'Bạn không thể tự xóa tài khoản đang đăng nhập.',
  STAFF_PROFILE_NOT_FOUND: 'Không tìm thấy hồ sơ nhân viên.',
  STAFF_PROFILE_USER_EXISTS:
    'Tài khoản này đã có hồ sơ nhân viên. Vui lòng dùng chức năng cập nhật.',
  STAFF_CODE_EXISTS:
    'Mã nhân viên đã tồn tại. Vui lòng chọn mã khác.',
  STAFF_USER_NOT_EXISTS:
    'Người dùng được gán không tồn tại hoặc không có vai trò STAFF.',
  STAFF_GARAGE_NOT_FOUND:
    'Không tìm thấy garage. Vui lòng kiểm tra lại garage_id.',
  STAFF_PROFILE_INACTIVE:
    'Hồ sơ nhân viên đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
  VEHICLE_INSPECTION_ALREADY_EXISTS:
    'Biên bản kiểm tra cho loại này đã tồn tại trên booking. Vui lòng chọn loại kiểm tra khác hoặc xem lại lịch sử.',
  VEHICLE_INSPECTION_NOT_FOUND:
    'Không tìm thấy biên bản kiểm tra.',
  BEFORE_WASH_INSPECTION_NOT_ALLOWED:
    'Biên bản trước rửa chỉ tạo được sau khi check-in và trước khi hoàn thành dịch vụ.',
  AFTER_WASH_INSPECTION_NOT_ALLOWED:
    'Biên bản sau rửa chỉ tạo được trong hoặc sau khi hoàn thành dịch vụ.',
  INSPECTION_CAPABILITY_REQUIRED:
    'Tài khoản không có quyền tạo biên bản kiểm tra.',
  INSPECTION_ASSIGNMENT_REQUIRED:
    'Bạn cần nhận (claim) booking này trước khi tạo biên bản kiểm tra.',
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined
  }

  const data = error.response?.data as ApiValidationError | undefined
  return data?.error_code
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const axiosError = error as AxiosError<ApiValidationError>
  const data = axiosError.response?.data

  if (data?.error_code && API_ERROR_MESSAGES[data.error_code]) {
    return API_ERROR_MESSAGES[data.error_code]
  }

  if (data?.errors?.length) {
    const translated = data.errors.map((item) => translateZodMessage(item))
    return translated.join('. ')
  }

  if (data?.message) {
    return data.message
  }

  if (axiosError.response?.status === 401) {
    return 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.'
  }

  if (axiosError.response?.status === 429) {
    return 'Quá nhiều yêu cầu tới máy chủ. Vui lòng đợi vài phút rồi thử lại.'
  }

  return fallback
}

/**
 * Dịch zod error messages sang tiếng Việt + ẩn path kỹ thuật.
 * BE dùng zod mặc định → trả "Invalid input: expected string, received null".
 * Nếu không nhận diện được thì trả message gốc.
 */
function translateZodMessage(item: { path?: string; message?: string }): string {
  const rawMessage = item.message ?? ''
  const path = item.path ?? ''

  if (/expected string, received null/i.test(rawMessage)) {
    return `Trường ${humanizePath(path)} không được để trống.`
  }

  if (/expected string, received undefined/i.test(rawMessage)) {
    return `Trường ${humanizePath(path)} không được để trống.`
  }

  if (/expected number, received/i.test(rawMessage)) {
    return `Trường ${humanizePath(path)} phải là số.`
  }

  if (/expected boolean, received/i.test(rawMessage)) {
    return `Trường ${humanizePath(path)} phải là đúng/sai.`
  }

  if (/Invalid resource id/i.test(rawMessage)) {
    return `Mã ${humanizePath(path)} không hợp lệ.`
  }

  if (/Required/i.test(rawMessage)) {
    return `Trường ${humanizePath(path)} là bắt buộc.`
  }

  return rawMessage
}

function humanizePath(path: string): string {
  if (!path) return 'dữ liệu'
  // "body.images.0.public_id" → "ảnh số 1 (public_id)" — gọn đủ để staff hiểu.
  return path
    .replace(/^body\./, '')
    .replace(/^params\./, '')
    .replace(/^query\./, '')
    .replace(/\.\d+\./g, ' thứ ')
    .replace(/_/g, ' ')
}

export function getApiRetryAfterSeconds(error: unknown): number | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined
  }

  const retryAfter = error.response?.headers['retry-after']
  if (!retryAfter) {
    return error.response?.status === 429 ? 120 : undefined
  }

  const parsed = Number(retryAfter)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 120
}

export function getApiStatusCode(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status
  }
  return undefined
}
