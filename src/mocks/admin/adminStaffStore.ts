import type { AdminStaffRecord } from '../../types/admin'
import type { StaffProfile, StaffType } from '../../types/staffProfile'
import { getAdminGarageById } from './adminGarageStore'
import { getAdminAllUsers, getAdminUserById } from './index'
import { mockAdminStaffRecords } from './staffProfiles'

function cloneRecords(records: AdminStaffRecord[]): AdminStaffRecord[] {
  return records.map((record) => ({
    user: { ...record.user },
    profile: { ...record.profile },
    garage: { ...record.garage },
  }))
}

let staffRecords = cloneRecords(mockAdminStaffRecords)

export function getAdminStaffRecordsFromStore(): AdminStaffRecord[] {
  return cloneRecords(staffRecords)
}

export function getAdminStaffRecordByProfileId(profileId: string) {
  const record = staffRecords.find((item) => item.profile.id === profileId)
  return record ? { ...record, profile: { ...record.profile }, user: { ...record.user }, garage: { ...record.garage } } : undefined
}

export function isStaffCodeTaken(staffCode: string, excludeProfileId?: string) {
  const normalized = staffCode.trim().toUpperCase()
  return staffRecords.some(
    (record) =>
      record.profile.staff_code.toUpperCase() === normalized &&
      record.profile.id !== excludeProfileId,
  )
}

export function getStaffUsersWithoutProfile() {
  const assignedUserIds = new Set(staffRecords.map((record) => record.user.id))
  return getAdminAllUsers().filter(
    (user) => user.role === 'STAFF' && !assignedUserIds.has(user.id),
  )
}

export function createAdminStaffRecord(input: {
  user_id: string
  staff_code: string
  staff_type: StaffType
  garage_id: string
  is_active: boolean
}) {
  const user = getAdminUserById(input.user_id)
  const garage = getAdminGarageById(input.garage_id)
  if (!user || user.role !== 'STAFF' || !garage) {
    return { ok: false as const, message: 'Dữ liệu nhân viên hoặc garage không hợp lệ.' }
  }

  if (staffRecords.some((record) => record.user.id === input.user_id)) {
    return { ok: false as const, message: 'Nhân viên này đã có hồ sơ staff.' }
  }

  if (isStaffCodeTaken(input.staff_code)) {
    return { ok: false as const, message: 'Mã nhân viên đã tồn tại.' }
  }

  const profile: StaffProfile = {
    id: `staff-profile-${Date.now()}`,
    user_id: input.user_id,
    staff_code: input.staff_code.trim().toUpperCase(),
    staff_type: input.staff_type,
    garage_id: input.garage_id,
    is_active: input.is_active,
  }

  const record: AdminStaffRecord = {
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar_url: user.avatar_url,
      is_active: user.is_active,
    },
    profile,
    garage,
  }

  staffRecords = [...staffRecords, record]
  return { ok: true as const, record }
}

export function updateAdminStaffRecord(
  profileId: string,
  input: {
    staff_code: string
    staff_type: StaffType
    garage_id: string
    is_active: boolean
  },
) {
  const index = staffRecords.findIndex((record) => record.profile.id === profileId)
  if (index === -1) {
    return { ok: false as const, message: 'Không tìm thấy hồ sơ nhân viên.' }
  }

  const garage = getAdminGarageById(input.garage_id)
  if (!garage) {
    return { ok: false as const, message: 'Garage không hợp lệ.' }
  }

  if (isStaffCodeTaken(input.staff_code, profileId)) {
    return { ok: false as const, message: 'Mã nhân viên đã tồn tại.' }
  }

  const current = staffRecords[index]
  const updated: AdminStaffRecord = {
    ...current,
    profile: {
      ...current.profile,
      staff_code: input.staff_code.trim().toUpperCase(),
      staff_type: input.staff_type,
      garage_id: input.garage_id,
      is_active: input.is_active,
    },
    garage,
  }

  staffRecords = [
    ...staffRecords.slice(0, index),
    updated,
    ...staffRecords.slice(index + 1),
  ]

  return { ok: true as const, record: updated }
}

export function toggleAdminStaffProfileActive(profileId: string) {
  const index = staffRecords.findIndex((record) => record.profile.id === profileId)
  if (index === -1) {
    return { ok: false as const, message: 'Không tìm thấy hồ sơ nhân viên.' }
  }

  const current = staffRecords[index]
  const updated: AdminStaffRecord = {
    ...current,
    profile: {
      ...current.profile,
      is_active: !current.profile.is_active,
    },
  }

  staffRecords = [
    ...staffRecords.slice(0, index),
    updated,
    ...staffRecords.slice(index + 1),
  ]

  return { ok: true as const, record: updated }
}
