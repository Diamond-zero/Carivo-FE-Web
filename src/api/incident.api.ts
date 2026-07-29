import type { ApiResponse } from '../types/api'
import type {
  ApiBookingIncident,
  ApiBookingIncidentActive,
  ApiBookingIncidentType,
  ApiCompensationVoucherType,
  ApiCustomerVoucher,
  ApiIncidentContactChannel,
  ApiIncidentDecision,
  ApiIncidentResolutionOptions,
  ApiIssueCompensationVoucherPayload,
  ApiRecordCustomerDecisionPayload,
  ApiReportBookingIncidentPayload,
} from '../types/api/staff'
import { apiClient } from './client'

// ============================================================================
// Staff-side incident workflow — POST/GET/PATCH /admin/bookings/:id/incidents...
// BE refs:
//   - docs/booking-incident-workflow.md
//   - Swagger: [STAFF, ADMIN] Booking operations - Report a garage operational incident
//
// Trong khi incident chưa RESOLVED, mọi thao tác dịch vụ trên booking đều trả
// 409 BOOKING_INCIDENT_DECISION_REQUIRED — FE phải disable các nút service.
// ============================================================================

export async function reportBookingIncidentApi(
  bookingId: string,
  payload: ApiReportBookingIncidentPayload,
) {
  if (
    payload.incident_type === 'OTHER_GARAGE_INCIDENT' &&
    !payload.description?.trim()
  ) {
    throw new Error('Mô tả là bắt buộc với sự cố khác.')
  }

  const { data } = await apiClient.post<
    ApiResponse<{ booking: unknown; incident: ApiBookingIncident }>
  >(`/admin/bookings/${bookingId}/incidents`, payload)
  return data.data
}

export async function getActiveBookingIncidentApi(bookingId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiBookingIncidentActive>>(
    `/admin/bookings/${bookingId}/incidents/active`,
  )
  return data.data
}

export async function getIncidentResolutionOptionsApi(
  bookingId: string,
  incidentId: string,
  days = 3,
) {
  const { data } = await apiClient.get<ApiResponse<ApiIncidentResolutionOptions>>(
    `/admin/bookings/${bookingId}/incidents/${incidentId}/resolution-options`,
    { params: { days } },
  )
  return data.data
}

/**
 * Staff ghi nhận quyết định của customer (qua điện thoại hoặc trực tiếp).
 * Nếu customer ghi nhận trong app thì BE không cần gọi endpoint này.
 */
export async function recordCustomerDecisionApi(
  bookingId: string,
  incidentId: string,
  payload: ApiRecordCustomerDecisionPayload,
) {
  if (
    payload.decision === 'RESCHEDULE_CUSTOM' &&
    !payload.new_start_time
  ) {
    throw new Error('Cần chọn thời gian mới cho lịch đặt theo yêu cầu khách.')
  }

  const { data } = await apiClient.patch<
    ApiResponse<{ booking: unknown; incident: ApiBookingIncident }>
  >(
    `/admin/bookings/${bookingId}/incidents/${incidentId}/record-customer-decision`,
    payload,
  )
  return data.data
}

export async function issueCompensationVoucherApi(
  bookingId: string,
  incidentId: string,
  payload: ApiIssueCompensationVoucherPayload,
) {
  if (
    payload.voucher_type === 'PERCENTAGE' &&
    (payload.value <= 0 || payload.value > 100)
  ) {
    throw new Error('Phần trăm giảm phải nằm trong khoảng 1-100.')
  }
  if (payload.voucher_type === 'FREE_SERVICE' && !payload.service_package_id) {
    throw new Error('Voucher dịch vụ miễn phí phải chọn gói dịch vụ.')
  }

  const { data } = await apiClient.post<
    ApiResponse<{ voucher: ApiCustomerVoucher; requires_approval: boolean }>
  >(
    `/admin/bookings/${bookingId}/incidents/${incidentId}/compensation-vouchers`,
    payload,
  )
  return data.data
}

// ============================================================================
// Helpers — thuận tiện cho UI hooks
// ============================================================================

export const INCIDENT_TYPE_LABELS: Record<ApiBookingIncidentType, string> = {
  WASH_BAY_FAILURE: 'Sự cố buồng rửa',
  STAFF_UNAVAILABLE: 'Sự cố nhân sự',
  OTHER_GARAGE_INCIDENT: 'Sự cố khác',
}

export const INCIDENT_DECISION_LABELS: Record<ApiIncidentDecision, string> = {
  REASSIGN_AND_CONTINUE: 'Phân bổ lại & tiếp tục',
  RESCHEDULE_NEAREST: 'Chuyển lịch gần nhất',
  RESCHEDULE_CUSTOM: 'Chuyển sang lịch khách chọn',
  CANCEL_BY_GARAGE: 'Hủy booking do garage',
}

export const COMPENSATION_VOUCHER_TYPE_LABELS: Record<
  ApiCompensationVoucherType,
  string
> = {
  FIXED_AMOUNT: 'Giảm số tiền cố định',
  PERCENTAGE: 'Giảm theo phần trăm',
  FREE_SERVICE: 'Tặng dịch vụ miễn phí',
}

export const INCIDENT_CONTACT_LABELS: Record<ApiIncidentContactChannel, string> =
  {
    PHONE: 'Qua điện thoại',
    IN_PERSON: 'Trực tiếp tại quầy',
  }

export type IncidentListItem = ApiBookingIncident
