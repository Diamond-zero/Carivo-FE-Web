import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAdminVehicleApi,
  deleteAdminVehicleApi,
  getAdminVehicleByIdApi,
  getAdminVehiclesApi,
  updateAdminVehicleApi,
  type AdminVehicleCreatePayload,
  type AdminVehicleUpdatePayload,
  type VehicleListParams,
} from '../../../api/vehicle.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapApiVehicle } from '../../../lib/mappers/adminMappers'
import type { Vehicle } from '../../../types/vehicle'
import { adminQueryKeys } from './queryKeys'

export function useAdminVehicles(params?: VehicleListParams) {
  const { isAuthenticated } = useAdminAuth()
  const query = useQuery({
    queryKey: adminQueryKeys.vehicles(params),
    queryFn: async () => {
      const result = await getAdminVehiclesApi(params)
      return {
        vehicles: result.vehicles.map(mapApiVehicle) as Vehicle[],
        meta: result.meta,
      }
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
  return {
    vehicles: query.data?.vehicles ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useAdminVehicle(vehicleId?: string) {
  const { isAuthenticated } = useAdminAuth()
  return useQuery({
    queryKey: adminQueryKeys.vehicles(vehicleId ?? ''),
    queryFn: async () => mapApiVehicle(await getAdminVehicleByIdApi(vehicleId!)),
    enabled: isAuthenticated && Boolean(vehicleId),
    staleTime: 30_000,
  })
}

export function useCreateAdminVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AdminVehicleCreatePayload) => createAdminVehicleApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.vehicles() })
    },
  })
}

export function useUpdateAdminVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      vehicleId,
      payload,
    }: {
      vehicleId: string
      payload: AdminVehicleUpdatePayload
    }) => updateAdminVehicleApi(vehicleId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.vehicles() })
    },
  })
}

export function useDeleteAdminVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vehicleId: string) => deleteAdminVehicleApi(vehicleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.vehicles() })
    },
  })
}