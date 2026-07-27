import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getStaffBookingsApi } from '../../../api/booking.api'
import {
  getWashHistoriesApi,
  type WashHistoryListParams,
} from '../../../api/washHistory.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapWashHistoriesWithBookingFallback } from '../../../utils/washHistoryEnrichment'
import { adminQueryKeys } from './queryKeys'

export type AdminWashHistoryVehicleTypeFilter = 'ALL' | 'MOTORBIKE' | 'CAR'

export interface AdminWashHistoryFilters {
  garageId?: string
  customerId?: string
  servicePackageId?: string
  vehicleType?: AdminWashHistoryVehicleTypeFilter
  from?: string
  to?: string
  page?: number
  limit?: number
  query?: string
}

const DEFAULT_PAGE_SIZE = 20

function toIsoDateTime(value?: string): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

function toAdminWashHistoryListParams(
  filters: AdminWashHistoryFilters,
): WashHistoryListParams {
  const params: WashHistoryListParams = {
    limit: filters.limit ?? DEFAULT_PAGE_SIZE,
    page: filters.page ?? 1,
  }

  if (filters.garageId && filters.garageId !== 'ALL') {
    params.garage_id = filters.garageId
  }

  if (filters.customerId) {
    params.customer_id = filters.customerId
  }

  if (filters.servicePackageId) {
    params.service_package_id = filters.servicePackageId
  }

  if (filters.vehicleType && filters.vehicleType !== 'ALL') {
    params.vehicle_type = filters.vehicleType
  }

  const fromIso = toIsoDateTime(filters.from)
  if (fromIso) {
    params.from = fromIso
  }

  const toIso = toIsoDateTime(filters.to)
  if (toIso) {
    params.to = toIso
  }

  return params
}

export function useAdminWashHistories(filters: AdminWashHistoryFilters = {}) {
  const { isAuthenticated } = useAdminAuth()
  const apiParams = useMemo(
    () => toAdminWashHistoryListParams(filters),
    [
      filters.garageId,
      filters.customerId,
      filters.servicePackageId,
      filters.vehicleType,
      filters.from,
      filters.to,
      filters.page,
      filters.limit,
    ],
  )

  return useQuery({
    queryKey: adminQueryKeys.washHistories(apiParams),
    queryFn: async () => {
      const result = await getWashHistoriesApi(apiParams)
      // BE `GET /admin/wash-histories` không join ngược từ booking — với booking
      // vãng lai, các field `customer` / `vehicle` thường rỗng và field legacy
      // `customer_name` / `license_plate` lại bị populate bằng ObjectId 24-char
      // (do snapshot từ booking). Fetch thêm danh sách booking trong cùng cửa
      // sổ thời gian để mapper fallback sang `guest_name` / `guest_phone` /
      // `license_plate` cho các bản ghi walk-in.
      const bookingListParams: Parameters<typeof getStaffBookingsApi>[0] = {
        limit: 100,
      }
      if (apiParams.garage_id) {
        bookingListParams.garage_id = apiParams.garage_id
      }
      if (apiParams.from) {
        bookingListParams.from = apiParams.from
      }
      if (apiParams.to) {
        bookingListParams.to = apiParams.to
      }
      const { bookings: cachedBookings } = await getStaffBookingsApi(bookingListParams)
      const histories = await mapWashHistoriesWithBookingFallback(
        result.histories,
        cachedBookings,
      )
      return {
        histories,
        meta: result.meta,
      }
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export { DEFAULT_PAGE_SIZE as ADMIN_WASH_HISTORY_PAGE_SIZE }