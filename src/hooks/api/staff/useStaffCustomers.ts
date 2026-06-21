import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { searchStaffCustomersApi } from '../../../api/customer.api'
import { useAuth } from '../../../contexts/AuthContext'
import { useBookings } from '../../../contexts/BookingContext'
import { mapApiStaffCustomer } from '../../../lib/mappers/staffMappers'
import { searchCustomersForGarage } from '../../../utils/customerLookup'
import { staffQueryKeys } from './queryKeys'

export function useStaffCustomers(search: string) {
  const { session, isAuthenticated } = useAuth()
  const { bookings } = useBookings()
  const garageId = session?.staffProfile.garage_id
  const trimmedSearch = search.trim()

  const fallbackCustomers = useMemo(
    () => searchCustomersForGarage(trimmedSearch, bookings, garageId ?? ''),
    [trimmedSearch, bookings, garageId],
  )

  const query = useQuery({
    queryKey: staffQueryKeys.customers(garageId, trimmedSearch),
    queryFn: async () => {
      if (!garageId) return fallbackCustomers

      const result = await searchStaffCustomersApi({
        garage_id: garageId,
        search: trimmedSearch || undefined,
      })
      return result.customers.map(mapApiStaffCustomer)
    },
    enabled: isAuthenticated && Boolean(garageId),
    staleTime: 30_000,
  })

  const customers = query.data ?? fallbackCustomers

  return {
    customers,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFromApi: query.isSuccess,
    refetch: query.refetch,
  }
}
