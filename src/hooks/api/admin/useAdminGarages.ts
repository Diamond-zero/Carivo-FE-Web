import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  createAdminGarageApi,
  deleteAdminGarageApi,
  getAdminGarageByIdApi,
  getAdminGaragesApi,
  toggleAdminGarageStatusApi,
  updateAdminGarageApi,
  type GarageCreatePayload,
  type GarageUpdatePayload,
} from '../../../api/garage.api'
import { getAdminWashBaysApi } from '../../../api/washBay.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapApiGarage } from '../../../lib/mappers/adminMappers'
import { mapApiWashBay } from '../../../lib/mappers/staffMappers'
import type { Garage } from '../../../types/garage'
import type { AdminGarageSummary } from '../../../utils/adminGarageLookup'
import { normalizeSearchText } from '../../../utils/booking'
import { adminQueryKeys } from './queryKeys'

export interface AdminGarageListFilters {
  query?: string
  statusFilter?: 'ALL' | 'ACTIVE' | 'INACTIVE'
}

function filterGarageSummaries(
  garages: AdminGarageSummary[],
  filters: AdminGarageListFilters,
): AdminGarageSummary[] {
  const normalizedQuery = normalizeSearchText((filters.query ?? '').trim())
  let result = garages

  if (filters.statusFilter === 'ACTIVE') {
    result = result.filter((garage) => garage.is_active)
  } else if (filters.statusFilter === 'INACTIVE') {
    result = result.filter((garage) => !garage.is_active)
  }

  if (!normalizedQuery) return result

  return result.filter((garage) => {
    const name = normalizeSearchText(garage.name)
    const code = normalizeSearchText(garage.garage_code)
    const city = normalizeSearchText(garage.city)
    const address = normalizeSearchText(garage.address)
    const phone = normalizeSearchText(garage.phone)

    return (
      name.includes(normalizedQuery) ||
      code.includes(normalizedQuery) ||
      city.includes(normalizedQuery) ||
      address.includes(normalizedQuery) ||
      phone.includes(normalizedQuery)
    )
  })
}

async function fetchAdminGarageSummaries(): Promise<AdminGarageSummary[]> {
  const [{ garages }, { washBays }] = await Promise.all([
    getAdminGaragesApi(),
    getAdminWashBaysApi(),
  ])

  const baysByGarage = new Map<string, ReturnType<typeof mapApiWashBay>[]>()
  for (const bay of washBays) {
    const mapped = mapApiWashBay(bay)
    const list = baysByGarage.get(mapped.garage_id) ?? []
    list.push(mapped)
    baysByGarage.set(mapped.garage_id, list)
  }

  return garages
    .map((garage) => {
      const mapped = mapApiGarage(garage)
      const bays = baysByGarage.get(mapped.id) ?? []
      return {
        ...mapped,
        washBayCount: bays.length,
        activeWashBayCount: bays.filter((bay) => bay.is_active).length,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}

export function useAdminGarages(filters: AdminGarageListFilters = {}) {
  const { isAuthenticated } = useAdminAuth()

  const query = useQuery({
    queryKey: adminQueryKeys.garages(),
    queryFn: fetchAdminGarageSummaries,
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  const allGarages = query.data ?? []
  const garages = useMemo(
    () => filterGarageSummaries(allGarages, filters),
    [allGarages, filters.query, filters.statusFilter],
  )

  return {
    garages,
    allGarages,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useAdminGarage(garageId?: string) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.garage(garageId ?? ''),
    queryFn: async () => mapApiGarage(await getAdminGarageByIdApi(garageId!)),
    enabled: isAuthenticated && Boolean(garageId),
    staleTime: 30_000,
  })
}

export function useCreateAdminGarage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: GarageCreatePayload) =>
      mapApiGarage(await createAdminGarageApi(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.garages() })
    },
  })
}

export function useUpdateAdminGarage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      garageId,
      payload,
    }: {
      garageId: string
      payload: GarageUpdatePayload
    }) => mapApiGarage(await updateAdminGarageApi(garageId, payload)),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.garages() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.garage(variables.garageId),
      })
    },
  })
}

export function useToggleAdminGarageStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      garageId,
      isActive,
    }: {
      garageId: string
      isActive: boolean
    }) => mapApiGarage(await toggleAdminGarageStatusApi(garageId, isActive)),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.garages() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.garage(variables.garageId),
      })
    },
  })
}

export function useDeleteAdminGarage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (garageId: string) => {
      await deleteAdminGarageApi(garageId)
      return garageId
    },
    onSuccess: (_data, garageId) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.garages() })
      void queryClient.removeQueries({ queryKey: adminQueryKeys.garage(garageId) })
    },
  })
}

export function useAdminGarageOptions(): Garage[] {
  const { allGarages } = useAdminGarages()
  return allGarages
}
