import type { User } from '../../types/user'
import {
  ADMIN_SESSION_STORAGE_KEY,
  STAFF_SESSION_STORAGE_KEY,
} from './constants'
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
    const { password: _password, ...user } = account
    return { type: 'admin', session: { user } }
  }

  return { type: 'staff', session: mockStaffLogin(phone, password) }
}

export function persistAdminSession(session: AdminAuthSession) {
  sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function readStoredAdminSession(): AdminAuthSession | null {
  const raw = sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY)
  if (!raw) return null

  try {
    const session = JSON.parse(raw) as AdminAuthSession
    if (session.user.role !== 'ADMIN') return null
    return session
  } catch {
    sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
    return null
  }
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
}

export function clearStaffSession() {
  sessionStorage.removeItem(STAFF_SESSION_STORAGE_KEY)
}
