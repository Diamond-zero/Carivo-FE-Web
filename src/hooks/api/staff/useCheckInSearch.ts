import { useMutation } from '@tanstack/react-query'
import { searchCheckInBookingsApi } from '../../../api/booking.api'
import { useAuth } from '../../../contexts/AuthContext'
import { mapApiBooking } from '../../../lib/mappers/staffMappers'

export function useCheckInSearch() {
  const { session } = useAuth()
  const garageId = session?.staffProfile.garage_id

  return useMutation({
    mutationFn: async (query: string) => {
      const bookings = await searchCheckInBookingsApi(query, garageId)
      return bookings.map(mapApiBooking)
    },
  })
}
