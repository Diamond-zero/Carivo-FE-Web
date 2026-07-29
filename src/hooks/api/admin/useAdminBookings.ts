import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  cancelBookingApi,
  getStaffBookingByIdApi,
  getStaffBookingsApi,
  reopenBookingServiceApi,
  type BookingListParams,
} from '../../../api/booking.api'
import { getAnalyticsBookingsApi } from '../../../api/analytics.api'
import {
  createPayosPaymentApi,
  markBookingPaidWithCashApi,
} from '../../../api/payment.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import {
  mapBookingAnalyticsOverview,
  mapBookingStatusStats,
} from '../../../lib/mappers/adminAnalyticsMappers'
import { mapApiBooking } from '../../../lib/mappers/staffMappers'
import type { AdminBookingFilters } from '../../../utils/adminBookingLookup'
import { toApiDateTimeString } from '../../../utils/walkIn'
import { adminQueryKeys } from './queryKeys'

export const ADMIN_BOOKING_PAGE_SIZE = 20

function toAdminBookingListParams(
  filters: AdminBookingFilters,
  page: number,
  limit: number,
): BookingListParams {
  const params: BookingListParams = { page, limit }

  if (filters.garageId !== 'ALL') {
    params.garage_id = filters.garageId
  }

  if (filters.status !== 'ALL') {
    params.status = filters.status
  }

  if (filters.vehicleType !== 'ALL') {
    params.vehicle_type = filters.vehicleType
  }

  if (filters.paymentStatus !== 'ALL') {
    params.payment_status = filters.paymentStatus
  }

  if (filters.dateFrom) {
    params.from = toApiDateTimeString(new Date(`${filters.dateFrom}T00:00:00`))
  }

  if (filters.dateTo) {
    params.to = toApiDateTimeString(new Date(`${filters.dateTo}T23:59:59`))
  }

  if (filters.query.trim()) {
    params.search = filters.query.trim()
  }

  return params
}

export function useAdminBookingList(
  filters: AdminBookingFilters,
  page = 1,
  limit = ADMIN_BOOKING_PAGE_SIZE,
) {
  const { isAuthenticated } = useAdminAuth()
  const apiParams = useMemo(
    () => toAdminBookingListParams(filters, page, limit),
    [filters, limit, page],
  )

  return useQuery({
    queryKey: adminQueryKeys.bookings(apiParams),
    queryFn: async () => {
      const result = await getStaffBookingsApi(apiParams)
      return {
        bookings: result.bookings.map(mapApiBooking),
        meta: result.meta,
      }
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: (previousData) => previousData,
  })
}

export function useAdminBookingStats() {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.bookings({ stats: true }),
    queryFn: async () => {
      const data = await getAnalyticsBookingsApi()
      const overview = mapBookingAnalyticsOverview(data)
      const statusStats = mapBookingStatusStats(data)
      const countByStatus = new Map(
        statusStats.map((item) => [item.status, item.count]),
      )

      return {
        total: overview.total_bookings,
        inProgress: countByStatus.get('IN_PROGRESS') ?? 0,
        completed: countByStatus.get('COMPLETED') ?? 0,
        canceled:
          (countByStatus.get('CANCELED') ?? 0) +
          (countByStatus.get('NO_SHOW') ?? 0),
      }
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useAdminRecentBookings(limit = 5) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.bookings({ recent: true, limit }),
    queryFn: async () => {
      const result = await getStaffBookingsApi({ limit })
      return result.bookings.map(mapApiBooking)
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useAdminBookingDetail(bookingId?: string) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.booking(bookingId ?? ''),
    queryFn: async () => {
      const booking = await getStaffBookingByIdApi(bookingId!)
      return mapApiBooking(booking)
    },
    enabled: isAuthenticated && Boolean(bookingId),
    retry: 1,
  })
}

export function useAdminBookingMutations(bookingId?: string) {
  const queryClient = useQueryClient()

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: adminQueryKeys.booking(bookingId ?? '') })
    await queryClient.invalidateQueries({ queryKey: adminQueryKeys.bookings() })
  }

  const cancelMutation = useMutation({
    mutationFn: () => cancelBookingApi(bookingId!),
    onSuccess: () => void invalidate(),
  })

  const markPaidMutation = useMutation({
    mutationFn: () => markBookingPaidWithCashApi(bookingId!),
    onSuccess: () => void invalidate(),
  })

  const payosMutation = useMutation({
    mutationFn: () => createPayosPaymentApi(bookingId!),
    onSuccess: () => void invalidate(),
  })

  const reopenServiceMutation = useMutation({
    mutationFn: (note?: string) => reopenBookingServiceApi(bookingId!, note),
    onSuccess: () => void invalidate(),
  })

  return {
    cancelMutation,
    markPaidMutation,
    payosMutation,
    reopenServiceMutation,
  }
}
