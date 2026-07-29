import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getAdminGaragesApi } from '../../../api/garage.api'
import {
  createAdminWashBayApi,
  deleteAdminWashBayApi,
  getAdminWashBayByIdApi,
  getAdminWashBaysApi,
  updateAdminWashBayApi,
  updateAdminWashBayStatusApi,
  type WashBayCreatePayload,
  type WashBayUpdatePayload,
} from '../../../api/washBay.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapApiGarage } from '../../../lib/mappers/adminMappers'
import { mapApiWashBay } from '../../../lib/mappers/staffMappers'
import type { VehicleType, WashBay, WashBayStatus } from '../../../types/washBay'
import type { AdminWashBaySummary } from '../../../utils/adminWashBayLookup'
import { normalizeSearchText } from '../../../utils/booking'
import { adminQueryKeys } from './queryKeys'

export interface AdminWashBayListFilters {
  query?: string
  garageFilter?: string | 'ALL'
  vehicleTypeFilter?: VehicleType | 'ALL'
  statusFilter?: WashBayStatus | 'ALL'
}

function filterWashBaySummaries(
  washBays: AdminWashBaySummary[],
  filters: AdminWashBayListFilters,
): AdminWashBaySummary[] {
  const normalizedQuery = normalizeSearchText((filters.query ?? '').trim())
  let result = washBays

  if (filters.garageFilter && filters.garageFilter !== 'ALL') {
    result = result.filter((bay) => bay.garage_id === filters.garageFilter)
  }

  if (filters.vehicleTypeFilter && filters.vehicleTypeFilter !== 'ALL') {
    result = result.filter((bay) => bay.vehicle_type === filters.vehicleTypeFilter)
  }

  if (filters.statusFilter && filters.statusFilter !== 'ALL') {
    result = result.filter((bay) => bay.status === filters.statusFilter)
  }

  if (!normalizedQuery) return result

  return result.filter((bay) => {
    const name = normalizeSearchText(bay.name)
    const code = normalizeSearchText(bay.bay_code)
    const garage = normalizeSearchText(bay.garage_name)

    return (
      name.includes(normalizedQuery) ||
      code.includes(normalizedQuery) ||
      garage.includes(normalizedQuery)
    )
  })
}

async function fetchAdminWashBaySummaries(): Promise<AdminWashBaySummary[]> {
  const [{ washBays }, { garages }] = await Promise.all([
    getAdminWashBaysApi(),
    getAdminGaragesApi(),
  ])

  const garageNames = new Map(
    garages.map((garage) => [garage.id, mapApiGarage(garage).name]),
  )

  return washBays
    .map((bay) => {
      const mapped = mapApiWashBay(bay)
      return {
        ...mapped,
        garage_name: garageNames.get(mapped.garage_id) ?? mapped.garage_id,
      }
    })
    .sort((a, b) => a.garage_name.localeCompare(b.garage_name, 'vi'))
}

export function useAdminWashBays(filters: AdminWashBayListFilters = {}) {
  const { isAuthenticated } = useAdminAuth()

  const query = useQuery({
    queryKey: adminQueryKeys.washBays(),
    queryFn: fetchAdminWashBaySummaries,
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  const allWashBays = useMemo(
    () => (query.data ?? []).filter((bay) => bay.is_active !== false),
    [query.data],
  )
  const washBays = useMemo(
    () => filterWashBaySummaries(allWashBays, filters),
    [allWashBays, filters],
  )

  return {
    washBays,
    allWashBays,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useAdminWashBay(washBayId?: string) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.washBay(washBayId ?? ''),
    queryFn: async () => mapApiWashBay(await getAdminWashBayByIdApi(washBayId!)),
    enabled: isAuthenticated && Boolean(washBayId),
    staleTime: 30_000,
  })
}

export function useCreateAdminWashBay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: WashBayCreatePayload) =>
      mapApiWashBay(await createAdminWashBayApi(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.washBays() })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.garages() })
    },
  })
}

export function useUpdateAdminWashBay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      washBayId,
      payload,
    }: {
      washBayId: string
      payload: WashBayUpdatePayload
    }) => mapApiWashBay(await updateAdminWashBayApi(washBayId, payload)),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.washBays() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.washBay(variables.washBayId),
      })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.garages() })
    },
  })
}

export function useUpdateAdminWashBayStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      washBayId,
      status,
    }: {
      washBayId: string
      status: 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE'
    }) => mapApiWashBay(await updateAdminWashBayStatusApi(washBayId, status)),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.washBays() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.washBay(variables.washBayId),
      })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.garages() })
    },
  })
}

export function useDeleteAdminWashBay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (washBayId: string) => {
      await deleteAdminWashBayApi(washBayId)
      return washBayId
    },
    onSuccess: (_data, washBayId) => {
      void queryClient.removeQueries({ queryKey: adminQueryKeys.washBays() })
      void queryClient.removeQueries({ queryKey: adminQueryKeys.washBay(washBayId) })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.garages() })
    },
  })
}

export type { WashBay }
