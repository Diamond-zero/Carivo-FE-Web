import type { ApiGarage, ApiStaffProfile, ApiUser } from '../../types/api'
import type { Garage } from '../../types/garage'
import type { StaffProfile, StaffType } from '../../types/staffProfile'
import type { User, UserRole } from '../../types/user'

export function normalizePhoneForDisplay(phone: string): string {
  const trimmed = phone.replace(/\s+/g, '').trim()
  if (trimmed.startsWith('+84')) {
    return `0${trimmed.slice(3)}`
  }
  return trimmed
}

export function mapApiUser(user: ApiUser): User {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email || null,
    phone: normalizePhoneForDisplay(user.phone),
    role: user.role as UserRole,
    avatar_url: user.avatar_url || null,
    is_active: user.is_active,
  }
}

export function mapApiStaffProfile(profile: ApiStaffProfile): StaffProfile {
  return {
    id: profile.id,
    user_id: profile.user_id,
    staff_code: profile.staff_code,
    staff_type: profile.staff_type as StaffType,
    garage_id: profile.garage_id,
    is_active: profile.is_active,
  }
}

export function mapApiGarage(garage: ApiGarage): Garage {
  return {
    id: garage.id,
    name: garage.name,
    garage_code: garage.garage_code,
    address: garage.address,
    city: garage.city,
    phone: garage.phone,
    opening_time: garage.opening_time,
    closing_time: garage.closing_time,
    slot_interval_minutes: garage.slot_interval_minutes,
    is_active: garage.is_active,
  }
}
