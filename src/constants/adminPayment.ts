/**
 * Constants cho trang Admin Payments.
 *
 * FE derive từ `ApiPaymentTransaction['status']` của BE swagger
 * (`payment.swagger.js` → `paymentTransactionSchema`). Không hard-code
 * trong component để chỗ khác (booking detail, staff side) có thể tái sử dụng.
 */
import type { ApiPaymentTransaction } from '../types/api/staff'

export type AdminPaymentStatus = ApiPaymentTransaction['status']

export const ADMIN_PAYMENT_STATUS_LABELS: Record<AdminPaymentStatus, string> = {
  INITIATED: 'Khởi tạo',
  PENDING: 'Chờ thanh toán',
  CANCELING: 'Đang huỷ',
  PAID: 'Đã thanh toán',
  CANCELED: 'Đã huỷ',
  EXPIRED: 'Hết hạn',
  FAILED: 'Thất bại',
}

export const ADMIN_PAYMENT_STATUS_ORDER: AdminPaymentStatus[] = [
  'INITIATED',
  'PENDING',
  'CANCELING',
  'PAID',
  'CANCELED',
  'EXPIRED',
  'FAILED',
]

export const ADMIN_PAYMENT_STATUS_VARIANT: Record<
  AdminPaymentStatus,
  'default' | 'info' | 'warning' | 'success' | 'danger'
> = {
  INITIATED: 'info',
  PENDING: 'warning',
  CANCELING: 'warning',
  PAID: 'success',
  CANCELED: 'danger',
  EXPIRED: 'default',
  FAILED: 'danger',
}

/**
 * Các status terminal (không thể thao tác thêm).
 * Dùng để disable button Cancel/Expire trên UI.
 */
export const ADMIN_PAYMENT_TERMINAL_STATUSES: AdminPaymentStatus[] = [
  'PAID',
  'CANCELED',
  'EXPIRED',
  'FAILED',
]

export const ADMIN_PAYMENT_CANCELLABLE_STATUSES: AdminPaymentStatus[] = [
  'INITIATED',
  'PENDING',
]

export const ADMIN_PAYMENT_EXPIRABLE_STATUSES: AdminPaymentStatus[] = [
  'PENDING',
  'INITIATED',
]

export const ADMIN_PAYMENT_STATUS_TONE: Record<AdminPaymentStatus, string> = {
  INITIATED: 'bg-sky-100 text-sky-700',
  PENDING: 'bg-amber-100 text-amber-700',
  CANCELING: 'bg-orange-100 text-orange-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  CANCELED: 'bg-rose-100 text-rose-700',
  EXPIRED: 'bg-slate-200 text-slate-700',
  FAILED: 'bg-red-100 text-red-700',
}

/**
 * Kênh khởi tạo payment.
 * BE swagger: `initiated_channel: 'CUSTOMER_SELF_SERVICE' | 'STAFF_ASSISTED'`.
 */
export const ADMIN_PAYMENT_CHANNEL_LABELS: Record<string, string> = {
  CUSTOMER_SELF_SERVICE: 'Khách tự thanh toán',
  STAFF_ASSISTED: 'Staff hỗ trợ',
  STAFF_PORTAL: 'Cổng staff',
  CUSTOMER_APP: 'App khách hàng',
  ADMIN_PORTAL: 'Cổng admin',
  WEBHOOK: 'Webhook PayOS',
  SYSTEM: 'Hệ thống',
}

export const ADMIN_PAYMENT_INITIATOR_ROLE_LABELS: Record<string, string> = {
  CUSTOMER: 'Khách hàng',
  STAFF: 'Nhân viên',
  ADMIN: 'Quản trị viên',
  WEBHOOK: 'Webhook',
  SYSTEM: 'Hệ thống',
}

export const ADMIN_PAYMENT_PROVIDER_LABELS: Record<string, string> = {
  PAYOS: 'PayOS',
}

export const ADMIN_PAYMENT_METHOD_LABELS: Record<string, string> = {
  QR: 'QR Code',
}

export const ADMIN_PAYMENT_PAGE_SIZE = 20

/**
 * Polling interval khi payment còn PENDING (trên detail page).
 * BE `pollBookingPayosPaymentApi` không rate-limit nặng, nhưng 5s là đủ
 * mượt với UX khách ở cổng.
 */
export const ADMIN_PAYMENT_POLL_INTERVAL_MS = 5_000
