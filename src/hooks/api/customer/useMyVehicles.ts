import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createMyVehicleApi,
  deleteMyVehicleApi,
  getMyVehicleByIdApi,
  getMyVehiclesApi,
  updateMyVehicleApi,
  type VehicleCreatePayload,
  type VehicleListParams,
  type VehicleUpdatePayload,
} from '../../../api/vehicle.api'
import { mapApiVehicle } from '../../../lib/mappers/adminMappers'
import type { Vehicle } from '../../../types/vehicle'
import { useAuth } from '../../../contexts/AuthContext'
import { customerQueryKeys } from '../staff/queryKeys'

export function useMyVehicles(params?: VehicleListParams) {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: customerQueryKeys.vehicles(params),
    queryFn: async () => {
      const result = await getMyVehiclesApi(params)
      return {
        vehicles: result.vehicles.map(mapApiVehicle) as Vehicle[],
        meta: result.meta,
      }
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useMyVehicle(vehicleId?: string) {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: customerQueryKeys.vehicle(vehicleId ?? ''),
    queryFn: async () => mapApiVehicle(await getMyVehicleByIdApi(vehicleId!)),
    enabled: isAuthenticated && Boolean(vehicleId),
    staleTime: 30_000,
  })
}

export function useCreateMyVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: VehicleCreatePayload) => createMyVehicleApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerQueryKeys.vehicles() })
    },
  })
}

export function useUpdateMyVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      vehicleId,
      payload,
    }: {
      vehicleId: string
      payload: VehicleUpdatePayload
    }) => updateMyVehicleApi(vehicleId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: customerQueryKeys.vehicles() })
      void queryClient.invalidateQueries({
        queryKey: customerQueryKeys.vehicle(variables.vehicleId),
      })
    },
  })
}

export function useDeleteMyVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vehicleId: string) => deleteMyVehicleApi(vehicleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerQueryKeys.vehicles() })
    },
  })
}