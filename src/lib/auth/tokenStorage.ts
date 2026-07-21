import {
  ACCESS_TOKEN_STORAGE_KEY,
  ADMIN_ACCESS_TOKEN_STORAGE_KEY,
  STAFF_ACCESS_TOKEN_STORAGE_KEY,
} from './constants'

// ============================================================================
// Token storage — tách 2 key riêng cho staff và admin.
// BE backend sử dụng 1 hệ thống JWT duy nhất nhưng session của mỗi FE role
// cần token riêng để tránh race khi người dùng đăng nhập cả staff & admin
// trong cùng phiên trình duyệt.
// ============================================================================

function pickActiveRole(): 'STAFF' | 'ADMIN' | null {
  const hasStaff = sessionStorage.getItem(STAFF_ACCESS_TOKEN_STORAGE_KEY)
  const hasAdmin = sessionStorage.getItem(ADMIN_ACCESS_TOKEN_STORAGE_KEY)
  // Ưu tiên admin nếu có — admin token thường được lưu trước khi load admin UI.
  if (hasAdmin) return 'ADMIN'
  if (hasStaff) return 'STAFF'
  return null
}

/**
 * Trả về access token phù hợp với URL đang gọi. Tránh gửi admin token cho
 * endpoint staff (hoặc ngược lại) khi cả hai đều còn trong sessionStorage.
 */
export function getAccessTokenForRequest(url: string): string | null {
  if (typeof window === 'undefined') return null

  if (url.startsWith('/admin/') || url.startsWith('admin/')) {
    return (
      sessionStorage.getItem(ADMIN_ACCESS_TOKEN_STORAGE_KEY) ??
      sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
    )
  }

  if (
    url.startsWith('/staff/') ||
    url.startsWith('staff/') ||
    url.startsWith('/staff-profiles') ||
    url.startsWith('staff-profiles')
  ) {
    return (
      sessionStorage.getItem(STAFF_ACCESS_TOKEN_STORAGE_KEY) ??
      sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
    )
  }

  // Customer / public / không rõ role — dùng cùng token duy nhất nếu có.
  const activeRole = pickActiveRole()
  if (activeRole === 'ADMIN') {
    return sessionStorage.getItem(ADMIN_ACCESS_TOKEN_STORAGE_KEY)
  }
  if (activeRole === 'STAFF') {
    return sessionStorage.getItem(STAFF_ACCESS_TOKEN_STORAGE_KEY)
  }
  return sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
}

/**
 * Tương thích ngược với code cũ — dùng key cũ, fallback sang role phổ biến nhất.
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  const legacy = sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  if (legacy) return legacy
  const role = pickActiveRole()
  if (!role) return null
  return sessionStorage.getItem(
    role === 'ADMIN'
      ? ADMIN_ACCESS_TOKEN_STORAGE_KEY
      : STAFF_ACCESS_TOKEN_STORAGE_KEY,
  )
}

interface SetAccessTokenOptions {
  role?: 'STAFF' | 'ADMIN'
}

export function setAccessToken(token: string, options: SetAccessTokenOptions = {}) {
  if (typeof window === 'undefined') return

  if (options.role === 'STAFF') {
    sessionStorage.setItem(STAFF_ACCESS_TOKEN_STORAGE_KEY, token)
    // Xóa legacy key nếu có token staff mới — tránh trộn role.
    sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
    return
  }

  if (options.role === 'ADMIN') {
    sessionStorage.setItem(ADMIN_ACCESS_TOKEN_STORAGE_KEY, token)
    sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
    return
  }

  // Không rõ role → fallback role đang active, nếu không có thì set legacy.
  const role = pickActiveRole()
  if (role === 'ADMIN') {
    sessionStorage.setItem(ADMIN_ACCESS_TOKEN_STORAGE_KEY, token)
  } else if (role === 'STAFF') {
    sessionStorage.setItem(STAFF_ACCESS_TOKEN_STORAGE_KEY, token)
  } else {
    sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)
  }
}

export function clearAccessToken(role?: 'STAFF' | 'ADMIN') {
  if (typeof window === 'undefined') return

  if (role === 'STAFF') {
    sessionStorage.removeItem(STAFF_ACCESS_TOKEN_STORAGE_KEY)
    return
  }

  if (role === 'ADMIN') {
    sessionStorage.removeItem(ADMIN_ACCESS_TOKEN_STORAGE_KEY)
    return
  }

  sessionStorage.removeItem(STAFF_ACCESS_TOKEN_STORAGE_KEY)
  sessionStorage.removeItem(ADMIN_ACCESS_TOKEN_STORAGE_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
}
