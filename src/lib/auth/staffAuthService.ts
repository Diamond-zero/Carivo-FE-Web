import { loginApi, logoutApi } from '../../api/auth.api'
import { getGarageByIdApi, getMyStaffProfileApi } from '../../api/staff.api'
import { getApiStatusCode } from '../../api/client'
import type { ApiUser } from '../../types/api'
import { STAFF_SESSION_STORAGE_KEY } from './constants'
import {
  mapApiGarage,
  mapApiStaffProfile,
  mapApiUser,
} from './mapApiTypes'
import {
  MockLoginError,
  mockStaffLogin,
  type StaffAuthSession,
} from './mockStaffLogin'
import { clearAccessToken, getAccessToken, setAccessToken } from './tokenStorage'

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

async function buildStaffSessionFromProfile(): Promise<StaffAuthSession> {
  const profile = await getMyStaffProfileApi()

  if (!profile.is_active) {
    throw new MockLoginError('STAFF_INACTIVE')
  }

  if (!profile.user) {
    throw new MockLoginError('NO_STAFF_PROFILE')
  }

  const garage = await getGarageByIdApi(profile.garage_id)

  return {
    user: mapApiUser(profile.user),
    staffProfile: mapApiStaffProfile(profile),
    garage: mapApiGarage(garage),
  }
}

export function persistStaffSession(session: StaffAuthSession) {
  sessionStorage.setItem(STAFF_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearStaffSession() {
  sessionStorage.removeItem(STAFF_SESSION_STORAGE_KEY)
  clearAccessToken()
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
    setAccessToken(loginData.access_token)

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

  if (!getAccessToken()) {
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
