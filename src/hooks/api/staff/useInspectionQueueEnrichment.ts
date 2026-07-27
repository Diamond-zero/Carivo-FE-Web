/**
 * Per-row enrichment hook cho Inspection Queue Page.
 *
 * Workspace list (`GET /staff/workspace/bookings`) trả về data redacted — không có
 * `customer_name`, `customer_phone`, `service_package_name`, `final_price`,
 * `earned_points` cho staff VEHICLE_INSPECTION_STAFF (BE policy). Để hiển thị
 * các cột này đúng với booking thật, ta gọi thêm detail endpoint
 * `GET /admin/bookings/:id` cho mỗi row.
 *
 * Lưu ý BE authorization:
 *  - Staff có `booking.read_garage` → truy cập mọi booking trong garage.
 *  - Staff chỉ có `booking.read_assigned` → chỉ truy cập booking đã được assign
 *    (vd: inspection staff vừa claim xong). Với các booking CHƯA claim
 *    (status `CHECKED_IN` chưa assigned) → endpoint trả 403.
 *  → Hook này treat 403 là "fallback sang workspace data" — không throw error
 *    ra UI.
 *
 * Khi BE đẩy các field redacted trực tiếp vào `/staff/workspace/bookings` response,
 * hook này sẽ trở thành no-op (BE data đã đủ) và có thể xoá.
 */
import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getStaffBookingByIdApi } from '../../../api/booking.api'
import { mapApiBooking } from '../../../lib/mappers/staffMappers'
import type { Booking } from '../../../types/booking'
import { staffQueryKeys } from './queryKeys'

export interface InspectionQueueEnrichment {
  /** Map từ booking_id → Booking đã được enrich (hoặc `undefined` nếu đang fetch / fail). */
  byBookingId: Map<string, Booking | undefined>
  /** Set các booking_id đang fetch chi tiết (loading). */
  loadingIds: Set<string>
  /** Set các booking_id bị 403 (staff không có quyền truy cập — fallback). */
  forbiddenIds: Set<string>
}

export function useInspectionQueueEnrichment(bookingIds: string[]): InspectionQueueEnrichment {
  // De-dupe + sort để queryKey stable.
  const sortedIds = useMemo(() => {
    return Array.from(new Set(bookingIds)).sort()
  }, [bookingIds])

  const queries = useQueries({
    queries: sortedIds.map((id) => ({
      queryKey: staffQueryKeys.bookingDetail(id),
      queryFn: async () => {
        try {
          const detail = await getStaffBookingByIdApi(id)
          return mapApiBooking(detail)
        } catch (err) {
          const status =
            (err as { response?: { status?: number }; status?: number })?.response
              ?.status ??
            (err as { status?: number })?.status ??
            0
          // 403 (STAFF_BOOKING_ASSIGNMENT_REQUIRED) hoặc 404 → trả null, không throw,
          // để hook caller xử lý fallback gracefully.
          if (status === 403 || status === 404) {
            return null
          }
          // Lỗi khác (network, 500...) → cũng treat là null để UI vẫn render.
          return null
        }
      },
      // Cache 30s — booking detail không đổi nhanh trong queue context, polling 15s
      // cho list sẽ refresh lại nếu có thay đổi (claim → assigned).
      staleTime: 30_000,
      retry: false,
    })),
  })

  return useMemo(() => {
    const byBookingId = new Map<string, Booking | undefined>()
    const loadingIds = new Set<string>()
    const forbiddenIds = new Set<string>()
    queries.forEach((query, idx) => {
      const id = sortedIds[idx]
      if (!id) return
      if (query.isLoading) {
        loadingIds.add(id)
        byBookingId.set(id, undefined)
        return
      }
      if (query.data === null) {
        // Cả 403, 404, network failure đều map về null → không có enrichment.
        // Ta đánh dấu forbiddenIds chỉ cho 403 (BE trả 403 cho assignment required).
        const errStatus =
          (query.error as { response?: { status?: number }; status?: number } | null)
            ?.response?.status ??
          (query.error as { status?: number } | null)?.status ??
          0
        if (errStatus === 403) {
          forbiddenIds.add(id)
        }
        byBookingId.set(id, undefined)
        return
      }
      byBookingId.set(id, query.data)
    })
    return { byBookingId, loadingIds, forbiddenIds }
  }, [queries, sortedIds])
}