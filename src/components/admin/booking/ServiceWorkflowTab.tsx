import { Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { ServiceWorkflowItemCard } from '../../../components/service/ServiceWorkflowItemCard'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../contexts/ToastContext'
import { getApiErrorCode, getApiErrorMessage } from '../../../api/client'
import {
  useAdminCompleteEarlyServiceItem,
  useAdminConfirmCompleteServiceItem,
  useAdminPauseServiceItem,
  useAdminResumeServiceItem,
  useAdminServiceWorkflow,
} from '../../../hooks/api/admin/useAdminServiceWorkflow'
import type { ApiServiceWorkflow } from '../../../types/api/staff'

interface ServiceWorkflowTabProps {
  bookingId: string
}

/**
 * Nhận diện lỗi "double-submit sau success": sau khi staff xác nhận hoàn thành /
 * complete-early, BE sẽ release assignment → submit lần 2 (React Strict Mode,
 * click đúp, v.v.) sẽ trả 403 STAFF_BOOKING_ASSIGNMENT_REQUIRED. UI đã cập
 * nhật phía trên nên ta nuốt lỗi này thay vì hiện toast gây hiểu nhầm.
 */
function isStaleAssignmentError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = getApiErrorCode(error)
  return code === 'STAFF_BOOKING_ASSIGNMENT_REQUIRED'
}

/**
 * Tab "Tiến trình dịch vụ" cho admin booking detail page.
 * - Polling mỗi 30s + refetch khi component mount.
 * - Hiển thị 4 phase BE trả: PENDING / RUNNING / PAUSED / INCIDENT_HOLD / COMPLETED.
 */
export function ServiceWorkflowTab({ bookingId }: ServiceWorkflowTabProps) {
  const { showToast } = useToast()
  const inFlightItemsRef = useRef<Set<string>>(new Set())
  const workflowQuery = useAdminServiceWorkflow(bookingId)
  const [activeItemKey, setActiveItemKey] = useState<string | null>(null)

  const completeEarly = useAdminCompleteEarlyServiceItem()
  const confirmComplete = useAdminConfirmCompleteServiceItem()
  const pause = useAdminPauseServiceItem()
  const resume = useAdminResumeServiceItem()

  const isMutating =
    completeEarly.isPending ||
    confirmComplete.isPending ||
    pause.isPending ||
    resume.isPending

  const runMutation = async (
    mutateFn: typeof completeEarly.mutateAsync,
    itemKey: string,
    successMsg: string,
  ) => {
    // Guard chống double-submit: khi user click đúp, HMR hot reload, hoặc React
    // Strict Mode dev re-invoke, mutation vẫn đang pending → lần 2 BE throw
    // 403 STAFF_BOOKING_ASSIGNMENT_REQUIRED (vì assignment đã được release sau
    // khi complete) và toast error đè lên toast success, gây hiểu nhầm.
    if (inFlightItemsRef.current.has(itemKey)) {
      return
    }
    inFlightItemsRef.current.add(itemKey)
    try {
      await mutateFn({ bookingId, itemKey })
      showToast(successMsg, 'success')
    } catch (error) {
      // Sau khi success, các lần submit tiếp theo (kể cả React Strict Mode)
      // sẽ bị BE từ chối vì assignment đã release. Coi như idempotent — UI
      // đã cập nhật → tải lại query là đủ, không cần toast error gây hiểu nhầm.
      if (isStaleAssignmentError(error)) {
        return
      }
      showToast(
        getApiErrorMessage(error, 'Thao tác thất bại. Vui lòng thử lại.'),
        'error',
      )
    } finally {
      inFlightItemsRef.current.delete(itemKey)
    }
  }

  if (workflowQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Đang tải tiến trình dịch vụ…
      </div>
    )
  }

  if (workflowQuery.isError || !workflowQuery.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Không thể tải tiến trình dịch vụ. Hãy thử lại sau.
      </div>
    )
  }

  const workflow: ApiServiceWorkflow = workflowQuery.data

  if (workflow.items?.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        Gói dịch vụ này chưa có hạng mục nào.
      </div>
    )
  }

  const handleRefresh = () => {
    void workflowQuery.refetch()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Tiến trình dịch vụ
          </h3>
          <p className="text-sm text-slate-500">
            Tự động chuyển tiếp khi hết giờ hoặc khi staff xác nhận hoàn thành sớm.
            Trong khi có sự cố, mọi thao tác dịch vụ sẽ bị tạm dừng.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleRefresh}>
          <Loader2 className="h-3.5 w-3.5" />
          Làm mới
        </Button>
      </div>

      {workflow.phase === 'INCIDENT_HOLD' || workflow.blocked_by_incident ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          Tiến trình đang tạm dừng do sự cố garage. Mọi thao tác sẽ bị khóa cho tới
          khi khách hàng đưa ra quyết định.
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {workflow.items?.map((item) => (
          <ServiceWorkflowItemCard
            key={item.item_key}
            item={item}
            isMutating={isMutating && activeItemKey === item.item_key}
            onCompleteEarly={() => {
              setActiveItemKey(item.item_key)
              void runMutation(
                completeEarly.mutateAsync,
                item.item_key,
                'Đã hoàn thành sớm hạng mục này.',
              ).finally(() => setActiveItemKey(null))
            }}
            onConfirmComplete={() => {
              setActiveItemKey(item.item_key)
              void runMutation(
                confirmComplete.mutateAsync,
                item.item_key,
                'Đã hoàn thành.',
              ).finally(() => setActiveItemKey(null))
            }}
            onPause={() => {
              setActiveItemKey(item.item_key)
              void runMutation(
                pause.mutateAsync,
                item.item_key,
                'Đã tạm dừng hạng mục.',
              ).finally(() => setActiveItemKey(null))
            }}
            onResume={() => {
              setActiveItemKey(item.item_key)
              void runMutation(
                resume.mutateAsync,
                item.item_key,
                'Đã tiếp tục hạng mục.',
              ).finally(() => setActiveItemKey(null))
            }}
          />
        ))}
      </div>
    </div>
  )
}
