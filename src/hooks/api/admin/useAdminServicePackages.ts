import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  activateAdminServicePackageApi,
  createAdminServicePackageApi,
  deactivateAdminServicePackageApi,
  getAdminServicePackageByIdApi,
  getAdminServicePackagesApi,
  updateAdminServicePackageApi,
  updateAdminServicePackageStepsApi,
  type ServicePackageCreatePayload,
  type ServicePackageUpdatePayload,
} from '../../../api/adminServicePackage.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapApiAdminServicePackage } from '../../../lib/mappers/adminMappers'
import type { ServiceType, ServiceStepTemplate } from '../../../types/servicePackage'
import type { VehicleType } from '../../../types/washBay'
import { normalizeSearchText } from '../../../utils/booking'
import { adminQueryKeys } from './queryKeys'

export interface AdminServicePackageListFilters {
  query?: string
  vehicleTypeFilter?: VehicleType | 'ALL'
  serviceTypeFilter?: ServiceType | 'ALL'
  statusFilter?: 'ALL' | 'ACTIVE' | 'INACTIVE'
}

function filterServicePackages(
  packages: ReturnType<typeof mapApiAdminServicePackage>[],
  filters: AdminServicePackageListFilters,
) {
  const normalizedQuery = normalizeSearchText((filters.query ?? '').trim())
  let result = packages

  if (filters.vehicleTypeFilter && filters.vehicleTypeFilter !== 'ALL') {
    result = result.filter((pkg) => pkg.vehicle_type === filters.vehicleTypeFilter)
  }

  if (filters.serviceTypeFilter && filters.serviceTypeFilter !== 'ALL') {
    result = result.filter((pkg) => pkg.service_type === filters.serviceTypeFilter)
  }

  if (filters.statusFilter === 'ACTIVE') {
    result = result.filter((pkg) => pkg.is_active)
  } else if (filters.statusFilter === 'INACTIVE') {
    result = result.filter((pkg) => !pkg.is_active)
  }

  if (!normalizedQuery) return result

  return result.filter((pkg) => {
    const name = normalizeSearchText(pkg.name)
    const description = normalizeSearchText(pkg.description)
    const id = normalizeSearchText(pkg.id)

    return (
      name.includes(normalizedQuery) ||
      description.includes(normalizedQuery) ||
      id.includes(normalizedQuery)
    )
  })
}

export function useAdminServicePackages(filters: AdminServicePackageListFilters = {}) {
  const { isAuthenticated } = useAdminAuth()

  const query = useQuery({
    queryKey: adminQueryKeys.servicePackages(),
    queryFn: async () => {
      const result = await getAdminServicePackagesApi()
      return result.packages
        .map(mapApiAdminServicePackage)
        .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  const allPackages = query.data ?? []
  const packages = useMemo(
    () => filterServicePackages(allPackages, filters),
    [
      allPackages,
      filters.query,
      filters.vehicleTypeFilter,
      filters.serviceTypeFilter,
      filters.statusFilter,
    ],
  )

  return {
    packages,
    allPackages,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useAdminServicePackage(packageId?: string) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.servicePackage(packageId ?? ''),
    queryFn: async () =>
      mapApiAdminServicePackage(await getAdminServicePackageByIdApi(packageId!)),
    enabled: isAuthenticated && Boolean(packageId),
    staleTime: 30_000,
  })
}

export function useCreateAdminServicePackage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ServicePackageCreatePayload) =>
      mapApiAdminServicePackage(await createAdminServicePackageApi(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.servicePackages() })
    },
  })
}

export function useUpdateAdminServicePackage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      packageId,
      payload,
    }: {
      packageId: string
      payload: ServicePackageUpdatePayload
    }) =>
      mapApiAdminServicePackage(await updateAdminServicePackageApi(packageId, payload)),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.servicePackages() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.servicePackage(variables.packageId),
      })
    },
  })
}

export function useToggleAdminServicePackageStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      packageId,
      isActive,
    }: {
      packageId: string
      isActive: boolean
    }) => {
      const pkg = isActive
        ? await activateAdminServicePackageApi(packageId)
        : await deactivateAdminServicePackageApi(packageId)
      return mapApiAdminServicePackage(pkg)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.servicePackages() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.servicePackage(variables.packageId),
      })
    },
  })
}

export function useUpdateAdminServicePackageSteps() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      packageId,
      steps,
    }: {
      packageId: string
      steps: ServiceStepTemplate[]
    }) =>
      mapApiAdminServicePackage(
        await updateAdminServicePackageStepsApi(packageId, steps),
      ),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.servicePackages() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.servicePackage(variables.packageId),
      })
    },
  })
}
