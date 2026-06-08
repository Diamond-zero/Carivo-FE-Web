export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN'

export interface User {
  id: string
  full_name: string
  email: string | null
  phone: string
  role: UserRole
  avatar_url: string | null
  is_active: boolean
}

export interface MockUser extends User {
  password: string
}
