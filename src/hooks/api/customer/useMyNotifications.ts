import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteMyNotificationApi,
  deleteMyNotificationsApi,
  getMyNotificationsApi,
  getMyUnreadNotificationCountApi,
  markAllMyNotificationsReadApi,
  markMyNotificationReadApi,
  type NotificationListParams,
} from '../../../api/notification.api'
import { useAuth } from '../../../contexts/AuthContext'
import { customerQueryKeys } from '../staff/queryKeys'

export function useMyNotifications(params?: NotificationListParams) {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: customerQueryKeys.notifications(params),
    queryFn: () => getMyNotificationsApi(params),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useMyUnreadNotificationCount() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: customerQueryKeys.notificationUnreadCount(),
    queryFn: () => getMyUnreadNotificationCountApi(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => markMyNotificationReadApi(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerQueryKeys.notifications() })
      void queryClient.invalidateQueries({
        queryKey: customerQueryKeys.notificationUnreadCount(),
      })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => markAllMyNotificationsReadApi(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerQueryKeys.notifications() })
      void queryClient.invalidateQueries({
        queryKey: customerQueryKeys.notificationUnreadCount(),
      })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => deleteMyNotificationApi(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerQueryKeys.notifications() })
      void queryClient.invalidateQueries({
        queryKey: customerQueryKeys.notificationUnreadCount(),
      })
    },
  })
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteMyNotificationsApi(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerQueryKeys.notifications() })
      void queryClient.invalidateQueries({
        queryKey: customerQueryKeys.notificationUnreadCount(),
      })
    },
  })
}