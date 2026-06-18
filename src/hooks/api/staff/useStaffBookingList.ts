import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getStaffBookingsApi } from '../../../api/booking.api'
import { useAuth } from '../../../contexts/AuthContext'
import { mapApiBooking } from '../../../lib/mappers/staffMappers'
import {
  toBookingListApiParams,
  type BookingFilters,
} from '../../../utils/bookingFilters'
import { staffQueryKeys } from './queryKeys'

export function useStaffBookingList(filters: BookingFilters) {
  const { session, isAuthenticated } = useAuth()
  const garageId = session?.staffProfile.garage_id
  const apiParams = useMemo(
    () => toBookingListApiParams(filters, garageId),
    [filters, garageId],
  )

  return useQuery({
    queryKey: staffQueryKeys.bookingList(garageId, apiParams),
    queryFn: async () => {
      const result = await getStaffBookingsApi(apiParams)
      return {
        bookings: result.bookings.map(mapApiBooking),
        meta: result.meta,
      }
    },
    enabled: isAuthenticated && Boolean(garageId),
    staleTime: 0,
    refetchOnMount: 'always',
  })
}
