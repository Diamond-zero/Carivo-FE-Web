import { loginApi } from '../../api/auth.api'
import { getApiStatusCode } from '../../api/client'
import {
  adminLogin,
  clearAdminSession,
  persistAdminSession,
  type AdminAuthSession,
} from './adminAuthService'
import { mapApiUser } from './mapApiTypes'
import {
  mockAuthLogin,
} from './mockAuthLogin'
import { MockLoginError, type StaffAuthSession } from './mockStaffLogin'
import {
  clearStaffSessionStorage,
  persistStaffSession,
} from './staffAuthService'
import { buildStaffSessionFromProfile } from './staffSessionBuilder'
import { clearAccessToken, setAccessToken } from './tokenStorage'

export type UnifiedLoginResult =
  | { type: 'admin'; session: AdminAuthSession }
  | { type: 'staff'; session: StaffAuthSession }

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').trim()
}

export async function unifiedLogin(
  phone: string,
  password: string,
): Promise<UnifiedLoginResult> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    const result = mockAuthLogin(phone, password)
    if (result.type === 'admin') {
      clearStaffSessionStorage()
      clearAdminSession()
      persistAdminSession(result.session)
      return result
    }
    clearAdminSession()
    clearStaffSessionStorage()
    persistStaffSession(result.session)
    return result
  }

  try {
    const loginData = await loginApi({
      phone: normalizePhone(phone),
      password,
    })

    if (loginData.user.role === 'ADMIN') {
      if (!loginData.user.is_active) {
        throw new MockLoginError('USER_INACTIVE')
      }
      setAccessToken(loginData.access_token, { role: 'ADMIN' })
      clearStaffSessionStorage()
      clearAdminSession()
      const session: AdminAuthSession = {
        user: mapApiUser(loginData.user),
      }
      persistAdminSession(session)
      return { type: 'admin', session }
    }

    if (loginData.user.role === 'STAFF') {
      if (!loginData.user.is_active) {
        throw new MockLoginError('USER_INACTIVE')
      }
      setAccessToken(loginData.access_token, { role: 'STAFF' })
      clearAdminSession()
      clearStaffSessionStorage()
      const session = await buildStaffSessionFromProfile()
      persistStaffSession(session)
      return { type: 'staff', session }
    }

    clearAccessToken()
    throw new MockLoginError('NOT_STAFF_ROLE')
  } catch (error) {
    // Token cũ có thể vẫn còn trong sessionStorage từ phiên trước — xóa sạch
    // cả hai role để role mới không bị "thừa hưởng" token rác.
    clearAccessToken()
    clearAdminSession()
    clearStaffSessionStorage()

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
    if (status === 429) {
      throw new MockLoginError('TOO_MANY_REQUESTS')
    }
    throw error
  }
}

export { adminLogin }
