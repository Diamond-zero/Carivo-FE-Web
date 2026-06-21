import { useQuery } from '@tanstack/react-query'
import { getStaffBookingByIdApi } from '../../../api/booking.api'
import { useAuth } from '../../../contexts/AuthContext'
import { mapApiBooking } from '../../../lib/mappers/staffMappers'
import { staffQueryKeys } from './queryKeys'

export function useStaffBookingDetail(bookingId?: string) {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: staffQueryKeys.bookingDetail(bookingId ?? ''),
    queryFn: async () => {
      const booking = await getStaffBookingByIdApi(bookingId!)
      return mapApiBooking(booking)
    },
    enabled: isAuthenticated && Boolean(bookingId),
    retry: 1,
  })
}
