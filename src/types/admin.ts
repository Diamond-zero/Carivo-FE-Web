import type { Garage } from './garage'
import type { CustomerLoyalty, LoyaltyTier, TierRule } from './loyalty'
import type { StaffProfile } from './staffProfile'
import type { User } from './user'

export interface AdminTierRule extends TierRule {
  id: string
  min_total_spent: number
  min_total_visits: number
  is_active: boolean
}

export interface AdminCustomerRecord {
  user: User
  loyalty: CustomerLoyalty
}

export interface AdminStaffRecord {
  user: User
  profile: StaffProfile
  garage: Garage
}

export type AdminBookingFilter = {
  garage_id?: string
  status?: string
  vehicle_type?: string
  date_from?: string
  date_to?: string
}

export type { LoyaltyTier }
