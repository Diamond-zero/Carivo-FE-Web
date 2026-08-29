import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  activateAdminVoucherTemplateApi,
  createAdminVoucherTemplateApi,
  deactivateAdminVoucherTemplateApi,
  deleteAdminVoucherTemplateApi,
  getAdminVoucherTemplateByIdApi,
  getAdminVoucherTemplatesApi,
  updateAdminVoucherTemplateApi,
  type VoucherTemplateCreatePayload,
  type VoucherTemplateListParams,
  type VoucherTemplateUpdatePayload,
} from '../../../api/voucherTemplate.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapApiVoucherTemplate } from '../../../lib/mappers/adminMappers'
import type { VoucherType } from '../../../types/voucherTemplate'
import { adminQueryKeys } from './queryKeys'

const DEFAULT_PAGE_SIZE = 20

export type AdminVoucherTemplateStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'

export interface AdminVoucherTemplateListFilters extends Partial<VoucherTemplateListParams> {
  statusFilter?: AdminVoucherTemplateStatusFilter
  query?: string
  voucher_type?: VoucherType
}

function toAdminVoucherTemplateParams(
  filters: AdminVoucherTemplateListFilters,
): VoucherTemplateListParams {
  const params: VoucherTemplateListParams = {
    page: filters.page ?? 1,
    limit: filters.limit ?? DEFAULT_PAGE_SIZE,
  }

  const trimmedSearch = filters.query?.trim()
  if (trimmedSearch) {
    params.search = trimmedSearch
  }

  if (filters.voucher_type) {
    params.voucher_type = filters.voucher_type
  }

  if (filters.tier) {
    params.tier = filters.tier
  }

  if (filters.statusFilter === 'ACTIVE') {
    params.is_active = true
  } else if (filters.statusFilter === 'INACTIVE') {
    params.is_active = false
  } else if (typeof filters.is_active === 'boolean') {
    params.is_active = filters.is_active
  }

  if (typeof filters.valid_only === 'boolean') {
    params.valid_only = filters.valid_only
  }

  return params
}

export function useAdminVoucherTemplates(filters: AdminVoucherTemplateListFilters = {}) {
  const { isAuthenticated } = useAdminAuth()
  const apiParams = toAdminVoucherTemplateParams(filters)

  const query = useQuery({
    queryKey: [...adminQueryKeys.voucherTemplatesList(), { params: apiParams }],
    queryFn: async () => {
      const result = await getAdminVoucherTemplatesApi(apiParams)
      return {
        voucherTemplates: result.voucherTemplates.map(mapApiVoucherTemplate),
        meta: result.meta,
      }
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const allVoucherTemplates = query.data?.voucherTemplates ?? []

  return {
    voucherTemplates: allVoucherTemplates,
    allVoucherTemplates,
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useAdminVoucherTemplate(voucherTemplateId?: string) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.voucherTemplate(voucherTemplateId ?? ''),
    queryFn: async () =>
      mapApiVoucherTemplate(await getAdminVoucherTemplateByIdApi(voucherTemplateId!)),
    enabled: isAuthenticated && Boolean(voucherTemplateId),
    staleTime: 30_000,
  })
}

export function useCreateAdminVoucherTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: VoucherTemplateCreatePayload) =>
      mapApiVoucherTemplate(await createAdminVoucherTemplateApi(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.voucherTemplatesList() })
    },
  })
}

export function useUpdateAdminVoucherTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      voucherTemplateId,
      payload,
    }: {
      voucherTemplateId: string
      payload: VoucherTemplateUpdatePayload
    }) =>
      mapApiVoucherTemplate(await updateAdminVoucherTemplateApi(voucherTemplateId, payload)),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.voucherTemplatesList() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.voucherTemplate(variables.voucherTemplateId),
      })
    },
  })
}

export function useDeleteAdminVoucherTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (voucherTemplateId: string) => {
      await deleteAdminVoucherTemplateApi(voucherTemplateId)
      return voucherTemplateId
    },
    onSuccess: (voucherTemplateId) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.voucherTemplatesList() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.voucherTemplate(voucherTemplateId),
      })
    },
  })
}

export function useToggleAdminVoucherTemplateStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      voucherTemplateId,
      isActive,
    }: {
      voucherTemplateId: string
      isActive: boolean
    }) => {
      const voucherTemplate = isActive
        ? await activateAdminVoucherTemplateApi(voucherTemplateId)
        : await deactivateAdminVoucherTemplateApi(voucherTemplateId)
      return mapApiVoucherTemplate(voucherTemplate)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.voucherTemplatesList() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.voucherTemplate(variables.voucherTemplateId),
      })
    },
  })
}

export { DEFAULT_PAGE_SIZE as ADMIN_VOUCHER_TEMPLATE_PAGE_SIZE }
