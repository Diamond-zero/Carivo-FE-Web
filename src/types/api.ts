export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface ApiValidationError {
  success: false
  message: string
  error_code?: string
  errors?: Array<{ path?: string; message: string }>
}

export interface ApiUser {
  id: string
  full_name: string
  email: string
  phone: string
  phone_verified_at: string | null
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN'
  avatar_url: string
  is_active: boolean
  last_login_at: string | null
  password_changed_at: string | null
  created_at: string
  updated_at: string
}

export interface AuthLoginData {
  access_token: string
  user: ApiUser
}

export interface PhoneVerificationChallenge {
  challenge_id: string
  phone: string
  purpose: 'REGISTER' | 'CHANGE_PHONE'
  expires_at: string
  retry_after_seconds: number
  debug_otp?: string
}

export interface PhoneVerificationToken {
  verification_token: string
  phone: string
  purpose: 'REGISTER' | 'CHANGE_PHONE'
  expires_at: string
}

export interface RegisterData {
  user: ApiUser
  walk_in_history_claim?: {
    claimed_bookings: number
    claimed_wash_histories: number
    linked_promotion_usages: number
  }
}

export interface ApiStaffProfile {
  id: string
  user_id: string
  user?: ApiUser
  staff_code: string
  staff_type: string
  garage_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ApiGarage {
  id: string
  name: string
  garage_code: string
  address: string
  ward?: string
  district?: string
  city: string
  phone: string
  email?: string
  latitude?: number
  longitude?: number
  opening_time: string
  closing_time: string
  slot_interval_minutes: number
  late_grace_minutes?: number
  description?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}
