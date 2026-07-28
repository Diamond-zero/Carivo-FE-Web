import type { ApiResponse } from '../types/api'
import type { ApiListResponse } from '../types/api/admin'
import type {
  ServicePriceRule,
  ServicePriceRulePayload,
  PriceQuote,
  VehiclePriceReview,
  VehiclePricingSnapshot,
} from '../types/api/pricing'
import type { ApiBooking } from '../types/api/staff'
import { apiClient } from './client'

export async function getServicePriceRulesApi() {
  const { data } = await apiClient.get<ApiListResponse<ServicePriceRule[]>>(
    '/admin/pricing/rules',
    { params: { limit: 100 } },
  )
  return data.data
}

export async function createServicePriceRuleApi(
  payload: ServicePriceRulePayload,
) {
  const { data } = await apiClient.post<ApiResponse<ServicePriceRule>>(
    '/admin/pricing/rules',
    payload,
  )
  return data.data
}

export async function updateServicePriceRuleApi(
  ruleId: string,
  payload: Partial<ServicePriceRulePayload>,
) {
  const { data } = await apiClient.patch<ApiResponse<ServicePriceRule>>(
    `/admin/pricing/rules/${ruleId}`,
    payload,
  )
  return data.data
}

export async function deactivateServicePriceRuleApi(ruleId: string) {
  const { data } = await apiClient.delete<ApiResponse<ServicePriceRule>>(
    `/admin/pricing/rules/${ruleId}`,
  )
  return data.data
}

export async function reviewBookingVehiclePriceApi(
  bookingId: string,
  vehicleSnapshot: VehiclePricingSnapshot,
) {
  const { data } = await apiClient.post<ApiResponse<VehiclePriceReview>>(
    `/admin/bookings/${bookingId}/vehicle-price-review`,
    { vehicle_snapshot: vehicleSnapshot },
  )
  return data.data
}

export async function confirmBookingVehiclePriceApi(
  bookingId: string,
  payload: {
    vehicle_snapshot: VehiclePricingSnapshot
    customer_confirmed: true
    reason: string
  },
) {
  const { data } = await apiClient.patch<
    ApiResponse<{ review: VehiclePriceReview; booking: ApiBooking }>
  >(`/admin/bookings/${bookingId}/vehicle-price-review/confirm`, payload)
  return data.data
}

export async function createWalkInPriceQuoteApi(payload: {
  garage_id: string
  vehicle_snapshot: VehiclePricingSnapshot
  service_package_id: string
  add_on_service_ids: string[]
  effective_at?: string
}) {
  const { data } = await apiClient.post<ApiResponse<PriceQuote>>(
    '/admin/pricing/quotes/walk-in',
    payload,
  )
  return data.data
}
