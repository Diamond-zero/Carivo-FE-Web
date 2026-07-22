import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  completeEarlyServiceItemApi,
  confirmCompleteServiceItemApi,
  getServiceWorkflowApi,
  pauseServiceItemApi,
  resumeServiceItemApi,
} from '../../../api/serviceWorkflow.api'

export const adminServiceWorkflowKeys = {
  workflow: (bookingId: string) =>
    ['admin', 'service-workflow', bookingId] as const,
}

export function useAdminServiceWorkflow(bookingId: string | undefined) {
  return useQuery({
    queryKey: bookingId
      ? adminServiceWorkflowKeys.workflow(bookingId)
      : ['admin', 'service-workflow', 'noop'],
    queryFn: () => getServiceWorkflowApi(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 10_000,
    refetchInterval: 30_000,
  })
}

interface MutationVars {
  bookingId: string
  itemKey: string
  note?: string
}

export function useAdminCompleteEarlyServiceItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, itemKey, note }: MutationVars) =>
      completeEarlyServiceItemApi(bookingId, itemKey, note),
    onSuccess: (_data, { bookingId }) => {
      void queryClient.invalidateQueries({
        queryKey: adminServiceWorkflowKeys.workflow(bookingId),
      })
    },
  })
}

export function useAdminConfirmCompleteServiceItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, itemKey, note }: MutationVars) =>
      confirmCompleteServiceItemApi(bookingId, itemKey, note),
    onSuccess: (_data, { bookingId }) => {
      void queryClient.invalidateQueries({
        queryKey: adminServiceWorkflowKeys.workflow(bookingId),
      })
    },
  })
}

export function useAdminPauseServiceItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, itemKey, note }: MutationVars) =>
      pauseServiceItemApi(bookingId, itemKey, note),
    onSuccess: (_data, { bookingId }) => {
      void queryClient.invalidateQueries({
        queryKey: adminServiceWorkflowKeys.workflow(bookingId),
      })
    },
  })
}

export function useAdminResumeServiceItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, itemKey, note }: MutationVars) =>
      resumeServiceItemApi(bookingId, itemKey, note),
    onSuccess: (_data, { bookingId }) => {
      void queryClient.invalidateQueries({
        queryKey: adminServiceWorkflowKeys.workflow(bookingId),
      })
    },
  })
}
