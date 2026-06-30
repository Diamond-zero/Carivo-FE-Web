import type { ApiResponse } from '../types/api'
import type { ApiListResponse } from '../types/api/admin'
import type { ApiServicePackage } from '../types/api/staff'
import type { ServiceStepTemplate } from '../types/servicePackage'
import { apiClient } from './client'

export interface AdminServicePackageListParams {
  page?: number
  limit?: number
  search?: string
  vehicle_type?: string
  service_type?: string
  requires_wash_bay?: boolean
  requires_care_staff?: boolean
  is_active?: boolean
}

export type ServicePackageCreatePayload = Omit<
  ApiServicePackage,
  'id' | 'created_at' | 'updated_at'
>
export type ServicePackageUpdatePayload = Partial<ServicePackageCreatePayload>

export async function getAdminServicePackagesApi(
  params?: AdminServicePackageListParams,
) {
  const { data } = await apiClient.get<ApiListResponse<ApiServicePackage[]>>(
    '/admin/service-packages',
    { params: { limit: 100, ...params } },
  )
  return { packages: data.data, meta: data.meta }
}

export async function getAdminServicePackageByIdApi(packageId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiServicePackage>>(
    `/admin/service-packages/${packageId}`,
  )
  return data.data
}

export async function createAdminServicePackageApi(
  payload: ServicePackageCreatePayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiServicePackage>>(
    '/admin/service-packages',
    payload,
  )
  return data.data
}

export async function updateAdminServicePackageApi(
  packageId: string,
  payload: ServicePackageUpdatePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiServicePackage>>(
    `/admin/service-packages/${packageId}`,
    payload,
  )
  return data.data
}

export async function activateAdminServicePackageApi(packageId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiServicePackage>>(
    `/admin/service-packages/${packageId}/activate`,
  )
  return data.data
}

export async function deactivateAdminServicePackageApi(packageId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiServicePackage>>(
    `/admin/service-packages/${packageId}/deactivate`,
  )
  return data.data
}

export async function updateAdminServicePackageStepsApi(
  packageId: string,
  steps: ServiceStepTemplate[],
) {
  const { data } = await apiClient.put<ApiResponse<ApiServicePackage>>(
    `/admin/service-packages/${packageId}/steps-template`,
    { steps_template: steps },
  )
  return data.data
}

export async function updateAdminServicePackageIncludedServicesApi(
  packageId: string,
  includedServiceIds: string[],
) {
  const { data } = await apiClient.put<ApiResponse<ApiServicePackage>>(
    `/admin/service-packages/${packageId}/included-services`,
    { included_service_ids: includedServiceIds },
  )
  return data.data
}
