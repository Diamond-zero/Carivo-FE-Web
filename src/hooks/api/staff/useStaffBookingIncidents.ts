import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getActiveBookingIncidentApi,
  getBookingIncidentHistoryApi,
  getIncidentResolutionOptionsApi,
  issueCompensationVoucherApi,
  recordCustomerDecisionApi,
  reportBookingIncidentApi,
} from '../../../api/incident.api'
import type {
  ApiBookingIncident,
  ApiIssueCompensationVoucherPayload,
  ApiRecordCustomerDecisionPayload,
  ApiReportBookingIncidentPayload,
} from '../../../types/api/staff'

export const staffIncidentQueryKeys = {
  active: (bookingId: string) => ['staff', 'booking', bookingId, 'incident-active'] as const,
  history: (bookingId: string) => ['staff', 'booking', bookingId, 'incidents'] as const,
  resolutionOptions: (bookingId: string, incidentId: string) =>
    ['staff', 'booking', bookingId, 'incident-resolution-options', incidentId] as const,
}

export function useActiveBookingIncident(bookingId: string | undefined) {
  return useQuery({
    queryKey: staffIncidentQueryKeys.active(bookingId ?? ''),
    queryFn: () => getActiveBookingIncidentApi(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useBookingIncidentHistory(bookingId: string | undefined) {
  return useQuery({
    queryKey: staffIncidentQueryKeys.history(bookingId ?? ''),
    queryFn: () => getBookingIncidentHistoryApi(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useIncidentResolutionOptions(
  bookingId: string | undefined,
  incidentId: string | undefined,
) {
  return useQuery({
    queryKey: staffIncidentQueryKeys.resolutionOptions(bookingId ?? '', incidentId ?? ''),
    queryFn: () => getIncidentResolutionOptionsApi(bookingId!, incidentId!),
    enabled: Boolean(bookingId) && Boolean(incidentId),
    staleTime: 30_000,
  })
}

export function useReportBookingIncidentMutation(bookingId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiReportBookingIncidentPayload) =>
      reportBookingIncidentApi(bookingId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: staffIncidentQueryKeys.active(bookingId),
      })
      void queryClient.invalidateQueries({
        queryKey: staffIncidentQueryKeys.history(bookingId),
      })
      void queryClient.invalidateQueries({ queryKey: ['staff', 'booking', 'detail', bookingId] })
    },
  })
}

export function useRecordCustomerDecisionMutation(bookingId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      incidentId,
      payload,
    }: {
      incidentId: string
      payload: ApiRecordCustomerDecisionPayload
    }) => recordCustomerDecisionApi(bookingId, incidentId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: staffIncidentQueryKeys.active(bookingId),
      })
      void queryClient.invalidateQueries({
        queryKey: staffIncidentQueryKeys.history(bookingId),
      })
      void queryClient.invalidateQueries({ queryKey: ['staff', 'booking', 'detail', bookingId] })
    },
  })
}

export function useIssueCompensationVoucherMutation(bookingId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      incidentId,
      payload,
    }: {
      incidentId: string
      payload: ApiIssueCompensationVoucherPayload
    }) => issueCompensationVoucherApi(bookingId, incidentId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff', 'customer-vouchers'] })
      void queryClient.invalidateQueries({
        queryKey: staffIncidentQueryKeys.active(bookingId),
      })
      void queryClient.invalidateQueries({
        queryKey: staffIncidentQueryKeys.history(bookingId),
      })
      void queryClient.invalidateQueries({ queryKey: ['staff', 'booking', 'detail', bookingId] })
    },
  })
}

export type { ApiBookingIncident }
