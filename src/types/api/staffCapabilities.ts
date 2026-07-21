/**
 * BE `GET /staff-profiles/me/capabilities` — trả về workspace của nhân viên hiện
 * tại cùng tập capability quyết định UI có hiển thị nút hành động hay không.
 *
 * BE không expose schema cụ thể (chỉ mô tả description). Type dưới đây dựa
 * trên BE docs `staff-api-changes.md` + `booking-incident-workflow.md` —
 * capability là các key snake_case mà frontend đọc để ẩn/hiện nút.
 */
export type StaffCapabilityKey =
  // Booking ops
  | 'booking.create'
  | 'booking.cancel'
  | 'booking.check_in'
  | 'booking.mark_no_show'
  | 'booking.assign_wash_bay'
  | 'booking.mark_paid_cash'
  | 'booking.initiate_payos'
  | 'booking.report_incident'
  | 'booking.resolve_incident'
  | 'booking.issue_compensation_voucher'
  // Service workflow
  | 'service_workflow.complete_early'
  | 'service_workflow.confirm_complete'
  | 'service_workflow.pause'
  | 'service_workflow.resume'
  // Inspection
  | 'inspection.create_before_wash'
  | 'inspection.create_after_wash'
  // Customer case (handover)
  | 'customer_case.create'
  | 'customer_case.update'
  | 'customer_case.resolve'
  // Type-change
  | 'staff_type_change.request'
  | 'staff_type_change.cancel'

export interface ApiStaffWorkspace {
  /** Staff id đang đăng nhập. */
  staff_profile_id: string
  user_id: string
  /** Vai trò hiện tại. */
  staff_type: string
  /** Garage được phân công (null = staff chưa gán garage). */
  garage_id: string | null
  /** Danh sách capability đang active. */
  capabilities: StaffCapabilityKey[]
  /** Chỉ số tổng quát — dùng cho dashboard. */
  permissions?: {
    can_manage_garage?: boolean
    can_manage_wash_bays?: boolean
    can_manage_service_packages?: boolean
    can_view_analytics?: boolean
  }
  /** Metadata bổ sung (vd. version của policy, last updated). */
  meta?: {
    policy_version?: string
    evaluated_at?: string
  }
}

/**
 * Type "open" cho response vì BE không công bố schema cụ thể. FE dùng
 * `ApiStaffWorkspace` cho những trường biết trước, các trường khác vẫn
 * truy cập được qua index signature.
 */
export type ApiStaffCapabilitiesResponse = ApiStaffWorkspace & Record<string, unknown>
