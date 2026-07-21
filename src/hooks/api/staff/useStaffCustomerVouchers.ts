import { useQuery } from '@tanstack/react-query'
import {
  getCustomerVouchersApi,
  type CustomerVoucherListParams,
} from '../../../api/customerVoucher.api'
import { useAuth } from '../../../contexts/AuthContext'
import { staffQueryKeys } from './queryKeys'

const DEFAULT_PAGE_SIZE = 20

export function useStaffCustomerVouchers(params?: CustomerVoucherListParams) {
  const { session } = useAuth()
  const garageId = session?.garage?.id

  return useQuery({
    queryKey: [...staffQueryKeys.customerVouchers(garageId), params],
    queryFn: () =>
      getCustomerVouchersApi({
        limit: DEFAULT_PAGE_SIZE,
        ...(garageId ? { garage_id: garageId } : {}),
        ...params,
      }),
    enabled: Boolean(session),
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export const CUSTOMER_VOUCHER_STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: 'Chờ duyệt',
  ISSUED: 'Đã phát hành',
  RESERVED: 'Đã giữ chỗ',
  REDEEMED: 'Đã sử dụng',
  EXPIRED: 'Hết hạn',
  REVOKED: 'Đã thu hồi',
}

export const CUSTOMER_VOUCHER_STATUS_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  PENDING_APPROVAL: 'warning',
  ISSUED: 'success',
  RESERVED: 'info',
  REDEEMED: 'default',
  EXPIRED: 'danger',
  REVOKED: 'danger',
}

export const CUSTOMER_VOUCHER_TYPE_LABELS: Record<string, string> = {
  FIXED_AMOUNT: 'Giảm cố định',
  PERCENTAGE: 'Giảm theo %',
  FREE_SERVICE: 'Tặng dịch vụ',
}

export const CUSTOMER_VOUCHER_SOURCE_LABELS: Record<string, string> = {
  INCIDENT: 'Bồi thường sự cố',
  CASE: 'Hồ sơ khiếu nại',
  PROMOTION: 'Khuyến mãi',
  WALK_IN: 'Walk-in',
}