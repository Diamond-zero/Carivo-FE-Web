import { useQuery } from '@tanstack/react-query'
import { getStaffBookingsByCustomerApi } from '../../../api/booking.api'
import { searchStaffCustomersApi } from '../../../api/customer.api'
import { useAuth } from '../../../contexts/AuthContext'
import { useBookings } from '../../../contexts/BookingContext'
import { mapApiBooking, mapApiStaffCustomer } from '../../../lib/mappers/staffMappers'
import {
  getCustomerVehicles,
  getCustomersForGarage,
  getGarageBookingsForCustomer,
  isCustomerAtGarage,
  type StaffCustomerSummary,
} from '../../../utils/customerLookup'
import { staffQueryKeys } from './queryKeys'

export function useStaffCustomerDetail(customerId?: string) {
  const { session, isAuthenticated } = useAuth()
  const { bookings } = useBookings()
  const garageId = session?.staffProfile.garage_id

  const profileQuery = useQuery({
    queryKey: staffQueryKeys.customerDetail(garageId, customerId),
    queryFn: async () => {
      const result = await searchStaffCustomersApi({
        garage_id: garageId!,
        limit: 100,
      })
      const customer = result.customers.find(
        (item) => item.customer_id === customerId,
      )
      if (customer) {
        return mapApiStaffCustomer(customer)
      }
      return null
    },
    enabled: isAuthenticated && Boolean(garageId && customerId),
    staleTime: 30_000,
  })

  const bookingsQuery = useQuery({
    queryKey: staffQueryKeys.customerBookings(garageId, customerId),
    queryFn: async () => {
      const result = await getStaffBookingsByCustomerApi(customerId!, garageId)
      return result.bookings.map(mapApiBooking)
    },
    enabled: isAuthenticated && Boolean(garageId && customerId),
    staleTime: 30_000,
  })

  const fallbackProfile: StaffCustomerSummary | null =
    customerId && garageId
      ? (getCustomersForGarage(bookings, garageId).find(
          (item) => item.user.id === customerId,
        ) ?? null)
      : null

  const profile = profileQuery.data ?? fallbackProfile
  const garageBookings =
    bookingsQuery.data ??
    (customerId && garageId
      ? getGarageBookingsForCustomer(customerId, bookings, garageId)
      : [])

  const vehicles =
    profile?.vehicles ??
    (customerId && garageId
      ? getCustomerVehicles(customerId, bookings, garageId)
      : [])

  const atGarage =
    Boolean(profile) ||
    (customerId && garageId
      ? isCustomerAtGarage(customerId, bookings, garageId)
      : false)

  return {
    profile,
    garageBookings,
    vehicles,
    atGarage,
    isLoading: profileQuery.isLoading || bookingsQuery.isLoading,
    isFromApi: profileQuery.isSuccess || bookingsQuery.isSuccess,
  }
}
