import type { ApiResponse } from '../types/api'
import type {
  ApiBooking,
  ApiBookingServiceStep,
  ApiLateArrivalOptions,
  ApiPaginatedBookings,
  ApiVehicleInspection,
  CancelBookingApiPayload,
  CreateInspectionApiPayload,
  MarkNoShowApiPayload,
  ResolveLateArrivalApiPayload,
  WalkInBookingApiPayload,
} from '../types/api/staff'
import { apiClient } from './client'

export interface BookingListParams {
  status?: string
  search?: string
  garage_id?: string
  customer_id?: string
  vehicle_id?: string
  service_package_id?: string
  vehicle_type?: string
  is_walk_in?: boolean
  from?: string
  to?: string
  page?: number
  limit?: number
}

export async function getStaffBookingsApi(params?: BookingListParams) {
  const { data } = await apiClient.get<
    ApiResponse<ApiBooking[]> & { meta?: ApiPaginatedBookings['meta'] }
  >('/admin/bookings', { params: { limit: 100, ...params } })
  return {
    bookings: data.data,
    meta: data.meta,
  }
}

export async function searchCheckInBookingsApi(
  query: string,
  garageId?: string,
) {
  const { bookings } = await getStaffBookingsApi({
    status: 'CONFIRMED',
    search: query.trim(),
    garage_id: garageId,
    limit: 20,
  })
  return bookings
}

export async function checkInBookingApi(bookingId: string, note?: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiBooking>>(
    `/admin/bookings/${bookingId}/check-in`,
    { note: note ?? '' },
  )
  return data.data
}

export async function createWalkInBookingApi(payload: WalkInBookingApiPayload) {
  const { data } = await apiClient.post<ApiResponse<ApiBooking>>(
    '/admin/bookings/walk-in',
    payload,
  )
  return data.data
}

export async function cancelBookingApi(
  bookingId: string,
  payload?: CancelBookingApiPayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiBooking>>(
    `/admin/bookings/${bookingId}/cancel`,
    payload ?? {},
  )
  return data.data
}

export async function markBookingNoShowApi(
  bookingId: string,
  payload?: MarkNoShowApiPayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiBooking>>(
    `/admin/bookings/${bookingId}/mark-no-show`,
    payload ?? {},
  )
  return data.data
}

export async function getLateArrivalOptionsApi(
  bookingId: string,
  days = 1,
) {
  const { data } = await apiClient.get<ApiResponse<ApiLateArrivalOptions>>(
    `/admin/bookings/${bookingId}/late-arrival-options`,
    { params: { days } },
  )
  return data.data
}

export async function resolveLateArrivalApi(
  bookingId: string,
  payload: ResolveLateArrivalApiPayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiBooking>>(
    `/admin/bookings/${bookingId}/resolve-late-arrival`,
    payload,
  )
  return data.data
}

export async function assignWashBayApi(bookingId: string, washBayId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiBooking>>(
    `/admin/bookings/${bookingId}/assign-wash-bay`,
    { wash_bay_id: washBayId },
  )
  return data.data
}

export async function startServiceApi(bookingId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiBooking>>(
    `/admin/bookings/${bookingId}/start-service`,
    {},
  )
  return data.data
}

export async function completeServiceApi(bookingId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiBooking>>(
    `/admin/bookings/${bookingId}/complete-service`,
    {},
  )
  return data.data
}

export async function completeServiceStepApi(
  bookingId: string,
  stepId: string,
  note?: string,
) {
  const { data } = await apiClient.patch<ApiResponse<unknown>>(
    `/admin/bookings/${bookingId}/service-steps/${stepId}/done`,
    { note: note ?? '' },
  )
  return data.data
}

export async function markBookingPaidApi(bookingId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiBooking>>(
    `/admin/bookings/${bookingId}/mark-paid`,
    {},
  )
  return data.data
}

export async function getBookingServiceStepsApi(bookingId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiBookingServiceStep[]>>(
    `/admin/bookings/${bookingId}/service-steps`,
  )
  return data.data
}

export async function getBookingInspectionsApi(bookingId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiVehicleInspection[]>>(
    `/admin/bookings/${bookingId}/inspections`,
  )
  return data.data
}

export async function createBookingInspectionApi(
  bookingId: string,
  payload: CreateInspectionApiPayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiVehicleInspection>>(
    `/admin/bookings/${bookingId}/inspections`,
    payload,
  )
  return data.data
}
