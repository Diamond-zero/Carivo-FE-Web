import type { User } from '../../types/user'
import {
  MockLoginError,
  mockStaffLogin,
  type StaffAuthSession,
} from './mockStaffLogin'
import { mockUsers } from '../../mocks/users'

export interface AdminAuthSession {
  user: User
}

export type AuthLoginResult =
  | { type: 'staff'; session: StaffAuthSession }
  | { type: 'admin'; session: AdminAuthSession }

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').trim()
}

export function mockAuthLogin(phone: string, password: string): AuthLoginResult {
  const normalizedPhone = normalizePhone(phone)
  const account = mockUsers.find(
    (user) => normalizePhone(user.phone) === normalizedPhone,
  )

  if (!account || account.password !== password) {
    throw new MockLoginError('INVALID_CREDENTIALS')
  }

  if (!account.is_active) {
    throw new MockLoginError('USER_INACTIVE')
  }

  if (account.role === 'CUSTOMER') {
    throw new MockLoginError('NOT_STAFF_ROLE')
  }

  if (account.role === 'ADMIN') {
    const { password, ...user } = account
    void password
    return { type: 'admin', session: { user } }
  }

  return { type: 'staff', session: mockStaffLogin(phone, password) }
}

export {
  clearAdminSession,
  persistAdminSession,
  readStoredAdminSession,
} from './adminAuthService'

export { clearStaffSessionStorage as clearStaffSession } from './staffAuthService'
