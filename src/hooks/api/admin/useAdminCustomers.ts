import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getStaffBookingsApi } from '../../../api/booking.api'
import { getAdminVehiclesApi } from '../../../api/adminServicePackage.api'
import {
  getAdminLoyaltyCustomerByIdApi,
  getAdminLoyaltyCustomersApi,
} from '../../../api/loyalty.api'
import { updateUserStatusApi } from '../../../api/staffProfile.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import {
  mapApiLoyaltyCustomer,
  mapApiLoyaltyDetail,
  mapApiVehicle,
} from '../../../lib/mappers/adminMappers'
import { mapApiBooking } from '../../../lib/mappers/staffMappers'
import type { LoyaltyTier } from '../../../types/loyalty'
import type { AdminCustomerSummary } from '../../../utils/adminCustomerLookup'
import { normalizeSearchText } from '../../../utils/booking'
import { adminQueryKeys } from './queryKeys'

export interface AdminCustomerListFilters {
  query?: string
  tierFilter?: LoyaltyTier | 'ALL'
}

function toAdminCustomerSummary(record: ReturnType<typeof mapApiLoyaltyCustomer>): AdminCustomerSummary {
  return record
}

function filterCustomers(
  customers: AdminCustomerSummary[],
  filters: AdminCustomerListFilters,
): AdminCustomerSummary[] {
  const normalizedQuery = normalizeSearchText((filters.query ?? '').trim())
  let result = customers

  if (filters.tierFilter && filters.tierFilter !== 'ALL') {
    result = result.filter((item) => item.loyalty.current_tier === filters.tierFilter)
  }

  if (!normalizedQuery) return result

  return result.filter((item) => {
    const name = normalizeSearchText(item.user.full_name)
    const phone = normalizeSearchText(item.user.phone)
    const email = normalizeSearchText(item.user.email ?? '')

    return (
      name.includes(normalizedQuery) ||
      phone.includes(normalizedQuery) ||
      email.includes(normalizedQuery)
    )
  })
}

export function useAdminCustomers(filters: AdminCustomerListFilters = {}) {
  const { isAuthenticated } = useAdminAuth()

  const query = useQuery({
    queryKey: adminQueryKeys.customers({
      search: filters.query,
      tier: filters.tierFilter,
    }),
    queryFn: async () => {
      const result = await getAdminLoyaltyCustomersApi({
        search: filters.query?.trim() || undefined,
        tier: filters.tierFilter && filters.tierFilter !== 'ALL' ? filters.tierFilter : undefined,
      })
      return result.customers
        .map((customer) => toAdminCustomerSummary(mapApiLoyaltyCustomer(customer)))
        .sort((a, b) => a.user.full_name.localeCompare(b.user.full_name, 'vi'))
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  const allCustomers = query.data ?? []
  const customers = useMemo(
    () => filterCustomers(allCustomers, filters),
    [allCustomers, filters.query, filters.tierFilter],
  )

  return {
    customers,
    allCustomers,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useAdminCustomerDetail(customerId?: string) {
  const { isAuthenticated } = useAdminAuth()

  const detailQuery = useQuery({
    queryKey: adminQueryKeys.customer(customerId ?? ''),
    queryFn: async () => mapApiLoyaltyDetail(await getAdminLoyaltyCustomerByIdApi(customerId!)),
    enabled: isAuthenticated && Boolean(customerId),
    staleTime: 30_000,
  })

  const vehiclesQuery = useQuery({
    queryKey: adminQueryKeys.vehicles({ customer_id: customerId }),
    queryFn: async () => {
      const result = await getAdminVehiclesApi({ customer_id: customerId })
      return result.vehicles
        .filter((vehicle) => vehicle.is_active)
        .map(mapApiVehicle)
    },
    enabled: isAuthenticated && Boolean(customerId),
    staleTime: 30_000,
  })

  const bookingsQuery = useQuery({
    queryKey: adminQueryKeys.bookings({ customer_id: customerId }),
    queryFn: async () => {
      const result = await getStaffBookingsApi({ customer_id: customerId })
      return result.bookings
        .map(mapApiBooking)
        .sort(
          (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
        )
    },
    enabled: isAuthenticated && Boolean(customerId),
    staleTime: 30_000,
  })

  return {
    user: detailQuery.data?.user ?? null,
    loyalty: detailQuery.data?.loyalty ?? null,
    tierHistory: detailQuery.data?.tierHistory ?? [],
    pointHistory: detailQuery.data?.pointHistory ?? [],
    vehicles: vehiclesQuery.data ?? [],
    bookings: bookingsQuery.data ?? [],
    isLoading:
      detailQuery.isLoading || vehiclesQuery.isLoading || bookingsQuery.isLoading,
    isError: detailQuery.isError || vehiclesQuery.isError || bookingsQuery.isError,
    error: detailQuery.error ?? vehiclesQuery.error ?? bookingsQuery.error,
    refetch: () => {
      void detailQuery.refetch()
      void vehiclesQuery.refetch()
      void bookingsQuery.refetch()
    },
  }
}

export function useUpdateAdminCustomerStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      isActive,
    }: {
      userId: string
      isActive: boolean
    }) => updateUserStatusApi(userId, isActive),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.customers() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.customer(variables.userId),
      })
    },
  })
}
