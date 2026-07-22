import { loginApi, logoutApi } from '../../api/auth.api'
import { getApiStatusCode } from '../../api/client'
import type { ApiUser } from '../../types/api'
import { STAFF_ACCESS_TOKEN_STORAGE_KEY, STAFF_SESSION_STORAGE_KEY } from './constants'
import {
  MockLoginError,
  mockStaffLogin,
  type StaffAuthSession,
} from './mockStaffLogin'
import { buildStaffSessionFromProfile } from './staffSessionBuilder'
import { clearAccessToken, setAccessToken } from './tokenStorage'

let staffLoginInFlight: Promise<StaffAuthSession> | null = null

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').trim()
}

function assertStaffLogin(user: ApiUser) {
  if (!user.is_active) {
    throw new MockLoginError('USER_INACTIVE')
  }

  if (user.role !== 'STAFF') {
    throw new MockLoginError('NOT_STAFF_ROLE')
  }
}

export type { StaffAuthSession } from './mockStaffLogin'

export function persistStaffSession(session: StaffAuthSession) {
  sessionStorage.setItem(STAFF_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearStaffSessionStorage() {
  sessionStorage.removeItem(STAFF_SESSION_STORAGE_KEY)
}

export function clearStaffSession() {
  clearStaffSessionStorage()
  clearAccessToken('STAFF')
}

export async function staffLogin(
  phone: string,
  password: string,
): Promise<StaffAuthSession> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return mockStaffLogin(phone, password)
  }

  if (staffLoginInFlight) {
    return staffLoginInFlight
  }

  staffLoginInFlight = performStaffLogin(phone, password)

  try {
    return await staffLoginInFlight
  } finally {
    staffLoginInFlight = null
  }
}

async function performStaffLogin(
  phone: string,
  password: string,
): Promise<StaffAuthSession> {
  try {
    const loginData = await loginApi({
      phone: normalizePhone(phone),
      password,
    })

    assertStaffLogin(loginData.user)
    setAccessToken(loginData.access_token, { role: 'STAFF' })

    const session = await buildStaffSessionFromProfile()
    persistStaffSession(session)
    return session
  } catch (error) {
    clearStaffSession()

    if (error instanceof MockLoginError) {
      throw error
    }

    const status = getApiStatusCode(error)
    if (status === 401 || status === 400) {
      throw new MockLoginError('INVALID_CREDENTIALS')
    }

    if (status === 403) {
      throw new MockLoginError('NOT_STAFF_ROLE')
    }

    if (status === 404) {
      throw new MockLoginError('NO_STAFF_PROFILE')
    }

    if (status === 429) {
      throw new MockLoginError('TOO_MANY_REQUESTS')
    }

    throw error
  }
}

export async function restoreStaffSession(): Promise<StaffAuthSession | null> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    const raw = sessionStorage.getItem(STAFF_SESSION_STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as StaffAuthSession
    } catch {
      clearStaffSession()
      return null
    }
  }

  // Chỉ restore staff session khi CÓ staff token thực sự. Nếu chỉ có admin
  // token (hoặc legacy token của admin) thì KHÔNG gọi /staff-profiles/me —
  // endpoint đó yêu cầu role STAFF, gọi với admin token sẽ 403 và gây
  // trắng màn hình ở mọi trang khi admin login. Đây là lý do trang admin
  // trước đây crash ngay khi load.
  const hasStaffToken = Boolean(sessionStorage.getItem(STAFF_ACCESS_TOKEN_STORAGE_KEY))
  if (!hasStaffToken) {
    clearStaffSession()
    return null
  }

  try {
    const session = await buildStaffSessionFromProfile()
    persistStaffSession(session)
    return session
  } catch {
    clearStaffSession()
    return null
  }
}

export async function refreshStaffSession(): Promise<StaffAuthSession> {
  const session = await buildStaffSessionFromProfile()
  persistStaffSession(session)
  return session
}

export async function staffLogout() {
  if (import.meta.env.VITE_USE_MOCK !== 'true') {
    try {
      await logoutApi()
    } catch {
      // Ignore logout API errors — always clear local session
    }
  }

  clearStaffSession()
}
