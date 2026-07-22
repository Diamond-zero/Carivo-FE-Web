/**
 * Hook cho Staff Workspace - danh sách bookings theo workflow
 * Dùng thay thế useStaffBookingList để hiển thị workspace cho tất cả staff types
 */

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getWorkspaceBookingsApi } from '../../../api/workspace.api'
import { useAuth } from '../../../contexts/AuthContext'
import { workspaceQueryKeys } from './queryKeys'

export interface WorkspaceBookingsParams {
  status?: string
  date?: string
  licensePlate?: string
  phone?: string
}

export function useWorkspaceBookings(filters: WorkspaceBookingsParams = {}) {
  const { session, isAuthenticated } = useAuth()
  const garageId = session?.staffProfile.garage_id

  const apiParams = useMemo(() => {
    const params: { page?: number; limit?: number; garage_id?: string; status?: string; from?: string; to?: string } = {
      limit: 100,
    }

    if (garageId) {
      params.garage_id = garageId
    }

    if (filters.status && filters.status !== 'ALL') {
      params.status = filters.status
    }

    if (filters.date) {
      const dayStart = new Date(`${filters.date}T00:00:00`)
      const dayEnd = new Date(`${filters.date}T23:59:59`)
      params.from = dayStart.toISOString()
      params.to = dayEnd.toISOString()
    }

    return params
  }, [filters, garageId])

  return useQuery({
    queryKey: workspaceQueryKeys.bookings(garageId, apiParams),
    queryFn: async () => {
      const result = await getWorkspaceBookingsApi(apiParams)
      return result
    },
    enabled: isAuthenticated && Boolean(garageId),
    staleTime: 0,
    refetchOnMount: 'always',
  })
}
