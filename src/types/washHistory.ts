export interface WashHistory {
  id: string
  booking_id: string
  garage_id: string
  license_plate: string
  service_package_id: string
  service_package_name?: string
  customer_name: string
  /** Số điện thoại liên hệ — khách đăng ký hoặc walk-in, fallback từ booking. */
  customer_phone?: string | null
  /** Phân biệt khách vãng lai để staff dễ nhận biết (claim, loyalty). */
  is_walk_in?: boolean
  final_price: number
  payment_method: 'CASH' | 'PAYOS'
  /** ISO datetime — moment booking thanh toán (BE `paid_at`). */
  paid_at?: string | null
  /** ISO datetime — moment staff bắt đầu service (BE `service_started_at`). */
  service_started_at?: string | null
  /** ISO datetime — moment staff xác nhận hoàn thành (BE `service_completed_at`). */
  service_completed_at?: string | null
  /** ISO datetime tổng quát (alias `paid_at`/legacy `washed_at`). */
  washed_at: string
  earned_points: number
}
