import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveCustomerVoucherApi,
  createAdminGiftVoucherApi,
  getCustomerVouchersApi,
  revokeCustomerVoucherApi,
  type CustomerVoucherListParams,
  type AdminGiftVoucherPayload,
} from '../../../api/customerVoucher.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { adminQueryKeys } from './queryKeys'

const DEFAULT_PAGE_SIZE = 20

export function useAdminCustomerVouchers(params?: CustomerVoucherListParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.customerVouchers(params),
    queryFn: () =>
      getCustomerVouchersApi({ limit: DEFAULT_PAGE_SIZE, ...params }),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useAdminCustomerVoucherMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: [...adminQueryKeys.all, 'customer-vouchers'],
      exact: false,
    })
    queryClient.refetchQueries({
      queryKey: [...adminQueryKeys.all, 'customer-vouchers'],
      exact: false,
    })
  }

  const approveMutation = useMutation({
    mutationFn: ({
      voucherId,
      note,
    }: {
      voucherId: string
      note?: string | null
    }) => approveCustomerVoucherApi(voucherId, note ? { note } : {}),
    onSuccess: () => void invalidate(),
  })

  const createGiftMutation = useMutation({
    mutationFn: (payload: AdminGiftVoucherPayload) =>
      createAdminGiftVoucherApi(payload),
    onSuccess: () => void invalidate(),
  })

  const revokeMutation = useMutation({
    mutationFn: ({
      voucherId,
      reason,
    }: {
      voucherId: string
      reason?: string
    }) => revokeCustomerVoucherApi(voucherId, reason ? { reason } : {}),
    onSuccess: () => void invalidate(),
  })

  return { createGiftMutation, approveMutation, revokeMutation }
}

export const ADMIN_CUSTOMER_VOUCHER_STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: 'Chờ duyệt',
  ISSUED: 'Đã phát hành',
  RESERVED: 'Đã giữ chỗ',
  USED: 'Đã sử dụng',
  EXPIRED: 'Hết hạn',
  REVOKED: 'Đã thu hồi',
}

export const ADMIN_CUSTOMER_VOUCHER_STATUS_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  PENDING_APPROVAL: 'warning',
  ISSUED: 'success',
  RESERVED: 'info',
  USED: 'default',
  EXPIRED: 'danger',
  REVOKED: 'danger',
}

export const ADMIN_CUSTOMER_VOUCHER_TYPE_LABELS: Record<string, string> = {
  FIXED_AMOUNT: 'Giảm cố định',
  PERCENTAGE: 'Giảm theo %',
  FREE_SERVICE: 'Tặng dịch vụ',
}

export const ADMIN_CUSTOMER_VOUCHER_SOURCE_LABELS: Record<string, string> = {
  INCIDENT: 'Bồi thường sự cố',
  CUSTOMER_CASE: 'Hồ sơ khiếu nại',
  ADMIN_GIFT: 'Admin tặng riêng',
}
