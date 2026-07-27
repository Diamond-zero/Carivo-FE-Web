import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import {
  cancelPaymentApi,
  expirePaymentApi,
  getPaymentApi,
  pollBookingPayosPaymentApi,
} from '../../../api/payment.api'
import { getStaffBookingsApi, type BookingListParams } from '../../../api/booking.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { adminQueryKeys } from './queryKeys'
import { ADMIN_PAYMENT_PAGE_SIZE } from '../../../constants/adminPayment'
import { mapApiBooking } from '../../../lib/mappers/staffMappers'
import type { ApiPaymentTransaction } from '../../../types/api/staff'
import type { Booking, PaymentStatus } from '../../../types/booking'

// ============================================================
// Filter contract
// ============================================================

export interface AdminPaymentFilters {
  /** Multi-select status filter (BE cho phép `?status=A&status=B`). */
  status?: PaymentStatus[] | PaymentStatus
  garageId?: string
  /** Search theo booking code / customer name / phone. */
  query?: string
  /** ISO local date YYYY-MM-DD. */
  dateFrom?: string
  /** ISO local date YYYY-MM-DD. */
  dateTo?: string
  page?: number
  limit?: number
}

export const DEFAULT_ADMIN_PAYMENT_FILTERS: AdminPaymentFilters = {
  status: 'ALL',
  garageId: 'ALL',
  query: '',
  dateFrom: '',
  dateTo: '',
  page: 1,
  limit: ADMIN_PAYMENT_PAGE_SIZE,
}

// ============================================================
// LIST — derive từ bookings vì BE chưa có GET /admin/payments list
// ============================================================

const RELEVANT_PAYMENT_STATUSES: PaymentStatus[] = [
  'PENDING',
  'PAID',
  'PARTIAL',
  'REFUNDED',
]

function toApiDateTime(value?: string, endOfDay = false): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  if (endOfDay) date.setHours(23, 59, 59, 999)
  return date.toISOString()
}

function toAdminPaymentListParams(
  filters: AdminPaymentFilters,
): BookingListParams {
  const params: BookingListParams = {
    limit: filters.limit ?? ADMIN_PAYMENT_PAGE_SIZE,
    page: filters.page ?? 1,
  }

  if (filters.garageId && filters.garageId !== 'ALL') {
    params.garage_id = filters.garageId
  }

  const fromIso = toApiDateTime(filters.dateFrom, false)
  if (fromIso) params.from = fromIso

  const toIso = toApiDateTime(filters.dateTo, true)
  if (toIso) params.to = toIso

  // Lọc theo payment_status để thu hẹp. Backend chấp nhận multi-value.
  if (filters.status && filters.status !== 'ALL') {
    if (Array.isArray(filters.status)) {
      params.status = filters.status
    } else {
      params.status = filters.status
    }
  }

  if (filters.query && filters.query.trim()) {
    params.search = filters.query.trim()
  }

  return params
}

/**
 * Hook list payment trên toàn hệ thống.
 *
 * BE chưa có `GET /admin/payments` list — ta derive từ `GET /admin/bookings`
 * (filter theo payment_status). Mỗi booking trong response có thể mang
 * payment summary nhưng ta chỉ cần `payment_status` + `final_price` để
 * hiển thị row. Click vào row → navigate `/admin/payments/:paymentId`
 * (BE sẽ fetch payment detail thật qua `getPaymentApi`).
 */
export function useAdminPaymentList(filters: AdminPaymentFilters) {
  const { isAuthenticated } = useAdminAuth()
  const apiParams = useMemo(() => toAdminPaymentListParams(filters), [filters])

  return useQuery({
    queryKey: adminQueryKeys.payments(apiParams),
    queryFn: async () => {
      const result = await getStaffBookingsApi(apiParams)
      // Map sang Booking (đầy đủ field UI cần) + filter chỉ giữ booking có payment.
      const items: Booking[] = result.bookings
        .filter((booking) => RELEVANT_PAYMENT_STATUSES.includes(booking.payment_status))
        .map(mapApiBooking)
      return {
        items,
        meta: result.meta,
      }
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

// ============================================================
// DETAIL — theo paymentId
// ============================================================

export function useAdminPaymentDetail(paymentId?: string) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.payment(paymentId ?? ''),
    queryFn: async () => {
      const result = await getPaymentApi(paymentId!)
      return result
    },
    enabled: isAuthenticated && Boolean(paymentId),
    retry: 1,
  })
}

// ============================================================
// DETAIL — theo bookingId (dùng cho inline slot trên booking detail)
// ============================================================

export function useAdminPaymentByBooking(bookingId?: string) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.paymentByBooking(bookingId ?? ''),
    queryFn: async () => {
      return pollBookingPayosPaymentApi(bookingId!, 'STAFF')
    },
    enabled: isAuthenticated && Boolean(bookingId),
    retry: 1,
  })
}

// ============================================================
// POLLING — dùng cho detail page khi status PENDING
// ============================================================

/**
 * Auto-poll (5s) payment theo bookingId khi status còn active.
 * Pause polling khi status terminal (PAID / CANCELED / EXPIRED / FAILED).
 */
export function useAdminPaymentPolling(bookingId?: string, intervalMs = 5_000) {
  const queryClient = useQueryClient()
  const query = useAdminPaymentByBooking(bookingId)

  const status = query.data?.payment?.status
  const isActive = status === 'INITIATED' || status === 'PENDING' || status === 'CANCELING'

  useEffect(() => {
    if (!bookingId || !isActive) return
    const handle = window.setInterval(() => {
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.paymentByBooking(bookingId),
      })
    }, intervalMs)
    return () => window.clearInterval(handle)
  }, [bookingId, isActive, intervalMs, queryClient])

  return query
}

// ============================================================
// MUTATIONS
// ============================================================

export function useAdminPaymentMutations() {
  const queryClient = useQueryClient()

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: [...adminQueryKeys.all, 'payments'] })
    queryClient.invalidateQueries({ queryKey: [...adminQueryKeys.all, 'payment'] })
    queryClient.invalidateQueries({
      queryKey: [...adminQueryKeys.all, 'payment-by-booking'],
    })
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.bookings() })
  }

  const cancelMutation = useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) =>
      cancelPaymentApi(paymentId, { reason }),
    onSuccess: () => void invalidateAll(),
  })

  const expireMutation = useMutation({
    mutationFn: (paymentId: string) => expirePaymentApi(paymentId),
    onSuccess: () => void invalidateAll(),
  })

  return { cancelMutation, expireMutation }
}

// ============================================================
// Helpers re-export
// ============================================================

export type { ApiPaymentTransaction }
