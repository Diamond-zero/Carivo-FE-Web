import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getAdminGaragesApi } from '../../../api/garage.api'
import {
  createStaffProfileApi,
  deleteStaffProfileApi,
  getStaffProfileByIdApi,
  getStaffProfilesApi,
  toggleStaffProfileStatusApi,
  updateStaffProfileApi,
  type StaffProfileCreatePayload,
  type StaffProfileUpdatePayload,
} from '../../../api/staffProfile.api'
import { getAdminUsersApi } from '../../../api/user.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapApiStaffRecord } from '../../../lib/mappers/adminMappers'
import { mapApiUser } from '../../../lib/auth/mapApiTypes'
import type { AdminStaffRecord } from '../../../types/admin'
import type { StaffType } from '../../../types/staffProfile'
import { normalizeSearchText } from '../../../utils/booking'
import { adminQueryKeys } from './queryKeys'

export interface AdminStaffListFilters {
  query?: string
  garageFilter?: string | 'ALL'
  staffTypeFilter?: StaffType | 'ALL'
}

function filterStaffRecords(
  records: AdminStaffRecord[],
  filters: AdminStaffListFilters,
): AdminStaffRecord[] {
  const normalizedQuery = normalizeSearchText((filters.query ?? '').trim())
  let result = records

  if (filters.garageFilter && filters.garageFilter !== 'ALL') {
    result = result.filter((record) => record.profile.garage_id === filters.garageFilter)
  }

  if (filters.staffTypeFilter && filters.staffTypeFilter !== 'ALL') {
    result = result.filter(
      (record) => record.profile.staff_type === filters.staffTypeFilter,
    )
  }

  if (!normalizedQuery) return result

  return result.filter((record) => {
    const name = normalizeSearchText(record.user.full_name)
    const phone = normalizeSearchText(record.user.phone)
    const code = normalizeSearchText(record.profile.staff_code)
    const garage = normalizeSearchText(record.garage.name)

    return (
      name.includes(normalizedQuery) ||
      phone.includes(normalizedQuery) ||
      code.includes(normalizedQuery) ||
      garage.includes(normalizedQuery)
    )
  })
}

async function fetchAdminStaffRecords(): Promise<AdminStaffRecord[]> {
  const [{ profiles }, { garages }] = await Promise.all([
    getStaffProfilesApi(),
    getAdminGaragesApi(),
  ])

  const garageById = new Map(garages.map((garage) => [garage.id, garage]))

  return profiles
    .map((profile) => mapApiStaffRecord(profile, garageById.get(profile.garage_id) ?? null))
    .filter((record): record is AdminStaffRecord => record !== null)
    .sort((a, b) => a.user.full_name.localeCompare(b.user.full_name, 'vi'))
}

export function useAdminStaff(filters: AdminStaffListFilters = {}) {
  const { isAuthenticated } = useAdminAuth()

  const query = useQuery({
    queryKey: adminQueryKeys.staff(),
    queryFn: fetchAdminStaffRecords,
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  const allStaff = query.data ?? []
  const staff = useMemo(
    () => filterStaffRecords(allStaff, filters),
    [allStaff, filters.query, filters.garageFilter, filters.staffTypeFilter],
  )

  return {
    staff,
    allStaff,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useAdminStaffProfile(profileId?: string) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.staffProfile(profileId ?? ''),
    queryFn: async () => {
      const [profile, { garages }] = await Promise.all([
        getStaffProfileByIdApi(profileId!),
        getAdminGaragesApi(),
      ])
      const garage = garages.find((item) => item.id === profile.garage_id) ?? null
      return mapApiStaffRecord(profile, garage)
    },
    enabled: isAuthenticated && Boolean(profileId),
    staleTime: 30_000,
  })
}

export function useAdminStaffUsersWithoutProfile() {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: [...adminQueryKeys.staff(), 'users-without-profile'],
    queryFn: async () => {
      const [{ users }, { profiles }] = await Promise.all([
        getAdminUsersApi({ role: 'STAFF' }),
        getStaffProfilesApi(),
      ])
      const profileUserIds = new Set(
        profiles.map((profile) => profile.user_id).filter(Boolean),
      )
      return users
        .filter((user) => !profileUserIds.has(user.id))
        .map(mapApiUser)
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useCreateAdminStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: StaffProfileCreatePayload) => {
      const profile = await createStaffProfileApi(payload)
      const { garages } = await getAdminGaragesApi()
      const garage = garages.find((item) => item.id === profile.garage_id) ?? null
      const record = mapApiStaffRecord(profile, garage)
      if (!record) {
        throw new Error('Không thể tạo hồ sơ nhân viên.')
      }
      return record
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.staff() })
    },
  })
}

export function useUpdateAdminStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      profileId,
      payload,
    }: {
      profileId: string
      payload: StaffProfileUpdatePayload
    }) => {
      const profile = await updateStaffProfileApi(profileId, payload)
      const { garages } = await getAdminGaragesApi()
      const garage = garages.find((item) => item.id === profile.garage_id) ?? null
      const record = mapApiStaffRecord(profile, garage)
      if (!record) {
        throw new Error('Không thể cập nhật hồ sơ nhân viên.')
      }
      return record
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.staff() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.staffProfile(variables.profileId),
      })
    },
  })
}

export function useToggleAdminStaffStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      profileId,
      isActive,
    }: {
      profileId: string
      isActive: boolean
    }) => {
      const profile = await toggleStaffProfileStatusApi(profileId, isActive)
      const { garages } = await getAdminGaragesApi()
      const garage = garages.find((item) => item.id === profile.garage_id) ?? null
      const record = mapApiStaffRecord(profile, garage)
      if (!record) {
        throw new Error('Không thể thay đổi trạng thái nhân viên.')
      }
      return record
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.staff() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.staffProfile(variables.profileId),
      })
    },
  })
}

export function useDeleteAdminStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (profileId: string) => {
      await deleteStaffProfileApi(profileId)
      return profileId
    },
    onSuccess: (_data, profileId) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.staff() })
      void queryClient.removeQueries({ queryKey: adminQueryKeys.staffProfile(profileId) })
    },
  })
}
