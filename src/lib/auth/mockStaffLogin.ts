import type { Garage } from '../../types/garage'
import type { StaffProfile } from '../../types/staffProfile'
import type { User } from '../../types/user'
import { mockGarage } from '../../mocks/garage'
import { mockStaffProfiles } from '../../mocks/staffProfile'
import { mockUsers } from '../../mocks/users'

export type MockLoginErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'NOT_STAFF_ROLE'
  | 'STAFF_INACTIVE'
  | 'NO_STAFF_PROFILE'
  | 'USER_INACTIVE'

export interface StaffAuthSession {
  user: User
  staffProfile: StaffProfile
  garage: Garage
}

const ERROR_MESSAGES: Record<MockLoginErrorCode, string> = {
  INVALID_CREDENTIALS: 'Số điện thoại hoặc mật khẩu không đúng.',
  NOT_STAFF_ROLE:
    'Tài khoản này không có quyền Staff. Vui lòng dùng cổng Admin hoặc ứng dụng khách hàng.',
  STAFF_INACTIVE: 'Tài khoản nhân viên đã bị vô hiệu hóa. Liên hệ quản trị viên.',
  NO_STAFF_PROFILE: 'Không tìm thấy hồ sơ nhân viên cho tài khoản này.',
  USER_INACTIVE: 'Tài khoản đã bị khóa. Liên hệ quản trị viên.',
}

export class MockLoginError extends Error {
  code: MockLoginErrorCode

  constructor(code: MockLoginErrorCode) {
    super(ERROR_MESSAGES[code])
    this.code = code
    this.name = 'MockLoginError'
  }
}

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').trim()
}

export function mockStaffLogin(
  phone: string,
  password: string,
): StaffAuthSession {
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

  if (account.role !== 'STAFF') {
    throw new MockLoginError('NOT_STAFF_ROLE')
  }

  const staffProfile = mockStaffProfiles.find(
    (profile) => profile.user_id === account.id,
  )

  if (!staffProfile) {
    throw new MockLoginError('NO_STAFF_PROFILE')
  }

  if (!staffProfile.is_active) {
    throw new MockLoginError('STAFF_INACTIVE')
  }

  const { password: _password, ...user } = account

  return {
    user,
    staffProfile,
    garage: { ...mockGarage },
  }
}

export const MOCK_LOGIN_ERROR_MESSAGES = ERROR_MESSAGES
