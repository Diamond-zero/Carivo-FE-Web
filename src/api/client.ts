import axios, { type AxiosError } from 'axios'
import type { ApiValidationError } from '../types/api'
import { getAccessToken } from '../lib/auth/tokenStorage'

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
  const token = getAccessToken()
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
    return data.errors.map((item) => item.message).join('. ')
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
