import { loginApi, logoutApi } from '../../api/auth.api'
import { getMyProfileApi } from '../../api/user.api'
import { getApiStatusCode } from '../../api/client'
import { ADMIN_SESSION_STORAGE_KEY } from './constants'
import { mapApiUser } from './mapApiTypes'
import {
  mockAuthLogin,
  type AdminAuthSession,
} from './mockAuthLogin'
import { MockLoginError } from './mockStaffLogin'
import { clearStaffSessionStorage } from './staffAuthService'
import { clearAccessToken, getAccessToken, setAccessToken } from './tokenStorage'

export type { AdminAuthSession }

let adminLoginInFlight: Promise<AdminAuthSession> | null = null

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').trim()
}

function assertAdminUser(user: { role: string; is_active: boolean }) {
  if (!user.is_active) {
    throw new MockLoginError('USER_INACTIVE')
  }
  if (user.role !== 'ADMIN') {
    throw new MockLoginError('NOT_ADMIN_ROLE')
  }
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

async function buildAdminSessionFromProfile(): Promise<AdminAuthSession> {
  const user = await getMyProfileApi()
  assertAdminUser(user)
  return { user: mapApiUser(user) }
}

export async function adminLogin(
  phone: string,
  password: string,
): Promise<AdminAuthSession> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    const result = mockAuthLogin(phone, password)
    if (result.type !== 'admin') {
      throw new MockLoginError(
        result.type === 'staff' ? 'NOT_ADMIN_ROLE' : 'INVALID_CREDENTIALS',
      )
    }
    clearStaffSessionStorage()
    persistAdminSession(result.session)
    return result.session
  }

  if (adminLoginInFlight) {
    return adminLoginInFlight
  }

  adminLoginInFlight = performAdminLogin(phone, password)
  try {
    return await adminLoginInFlight
  } finally {
    adminLoginInFlight = null
  }
}

async function performAdminLogin(
  phone: string,
  password: string,
): Promise<AdminAuthSession> {
  try {
    const loginData = await loginApi({
      phone: normalizePhone(phone),
      password,
    })

    assertAdminUser(loginData.user)
    setAccessToken(loginData.access_token)
    clearStaffSessionStorage()

    const session: AdminAuthSession = {
      user: mapApiUser(loginData.user),
    }
    persistAdminSession(session)
    return session
  } catch (error) {
    clearAdminSession()
    clearAccessToken()

    if (error instanceof MockLoginError) {
      throw error
    }

    const status = getApiStatusCode(error)
    if (status === 401 || status === 400) {
      throw new MockLoginError('INVALID_CREDENTIALS')
    }
    if (status === 403) {
      throw new MockLoginError('NOT_ADMIN_ROLE')
    }
    if (status === 429) {
      throw new MockLoginError('TOO_MANY_REQUESTS')
    }
    throw error
  }
}

export async function restoreAdminSession(): Promise<AdminAuthSession | null> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return readStoredAdminSession()
  }

  if (!getAccessToken()) {
    clearAdminSession()
    return null
  }

  const stored = readStoredAdminSession()
  if (!stored) {
    return null
  }

  try {
    const session = await buildAdminSessionFromProfile()
    persistAdminSession(session)
    return session
  } catch {
    clearAdminSession()
    clearAccessToken()
    return null
  }
}

export async function refreshAdminSession(): Promise<AdminAuthSession> {
  const session = await buildAdminSessionFromProfile()
  persistAdminSession(session)
  return session
}

export async function adminLogout() {
  if (import.meta.env.VITE_USE_MOCK !== 'true') {
    try {
      await logoutApi()
    } catch {
      // ignore
    }
  }
  clearAdminSession()
  clearAccessToken()
}
