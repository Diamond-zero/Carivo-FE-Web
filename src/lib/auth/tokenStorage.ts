import {
  ACCESS_TOKEN_STORAGE_KEY,
  ADMIN_ACCESS_TOKEN_STORAGE_KEY,
  STAFF_ACCESS_TOKEN_STORAGE_KEY,
} from './constants'

// ============================================================================
// Token storage — tách 2 key riêng cho staff và admin.
//
// BE backend dùng 1 hệ thống JWT duy nhất nhưng chia sẻ nhiều endpoint
// `/admin/*` giữa STAFF và ADMIN (vd. `/admin/bookings`, `/admin/wash-histories`,
// `/admin/wash-bays`). Vì vậy, việc chọn token KHÔNG thể chỉ dựa vào URL
// bắt đầu `/admin/` — phải dựa vào (a) role hiện đang active trong session
// và (b) whitelist các admin route mà STAFF cũng có quyền truy cập.
//
// Quy tắc:
//  1. URL nằm trong STAFF_ALLOWED_ADMIN_PATHS → ưu tiên token của role đang
//     active (STAFF nếu staff đang login, ADMIN nếu admin đang login). Fallback
//     về legacy key nếu không tìm thấy.
//  2. URL `/admin/*` khác (admin-only) → chỉ lấy ADMIN token.
//  3. URL `/staff-profiles*` → lấy STAFF token (admin gọi staff-profiles thì
//     BE phân biệt qua role claim trong JWT, không phải qua URL).
//  4. Các URL khác → token của role đang active.
// ============================================================================

/**
 * Whitelist các `/admin/*` path mà STAFF cũng có quyền truy cập theo
 * Swagger `staff-api-changes.md` (roles: STAFF, ADMIN).
 *
 * Mỗi entry là một prefix; nếu URL bắt đầu bằng prefix này thì token sẽ
 * được chọn theo role đang active thay vì cứng nhắc lấy ADMIN token.
 */
const STAFF_ALLOWED_ADMIN_PATHS: readonly string[] = [
  '/admin/bookings',
  '/admin/wash-histories',
  '/admin/wash-bays',
  '/admin/promotions',
  '/admin/service-packages',
  '/admin/garages',
  '/admin/staff-profiles/me', // profile & capabilities của staff hiện tại
]

function isStaffAllowedAdminPath(url: string): boolean {
  return STAFF_ALLOWED_ADMIN_PATHS.some(
    (prefix) => url.startsWith(prefix) || url.startsWith(prefix.replace(/^\//, '')),
  )
}

function pickActiveRole(): 'STAFF' | 'ADMIN' | null {
  const hasStaff = sessionStorage.getItem(STAFF_ACCESS_TOKEN_STORAGE_KEY)
  const hasAdmin = sessionStorage.getItem(ADMIN_ACCESS_TOKEN_STORAGE_KEY)
  // Ưu tiên admin nếu có — admin token thường được lưu trước khi load admin UI.
  if (hasAdmin) return 'ADMIN'
  if (hasStaff) return 'STAFF'
  return null
}

function readRoleToken(role: 'STAFF' | 'ADMIN'): string | null {
  const key =
    role === 'ADMIN'
      ? ADMIN_ACCESS_TOKEN_STORAGE_KEY
      : STAFF_ACCESS_TOKEN_STORAGE_KEY
  return (
    sessionStorage.getItem(key) ??
    // Fallback cho dữ liệu cũ / dev session — nếu cùng role có token legacy.
    sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  )
}

/**
 * Trả về access token phù hợp với URL đang gọi.
 *
 * - Với `/admin/*` mà STAFF cũng truy cập được: lấy token của role đang active.
 * - Với `/admin/*` admin-only: chỉ lấy ADMIN token (staff không được gọi).
 * - Với `/staff-profiles*`: lấy token của role đang active (admin vẫn có thể
 *   xem hồ sơ staff trong một số endpoint).
 */
export function getAccessTokenForRequest(url: string): string | null {
  if (typeof window === 'undefined') return null

  const isAdminPath =
    url.startsWith('/admin/') || url.startsWith('admin/')
  const isStaffPath =
    url.startsWith('/staff/') ||
    url.startsWith('staff/') ||
    url.startsWith('/staff-profiles') ||
    url.startsWith('staff-profiles')

  // ---- Admin path ----
  if (isAdminPath) {
    if (isStaffAllowedAdminPath(url)) {
      // Endpoint chia sẻ giữa STAFF và ADMIN — ưu tiên token của role
      // đang active để staff không bị mất quyền khi đang ở staff UI.
      const activeRole = pickActiveRole()
      if (activeRole) return readRoleToken(activeRole)
      // Không có role nào active → fallback legacy.
      return sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
    }
    // Admin-only path.
    return readRoleToken('ADMIN')
  }

  // ---- Staff path ----
  if (isStaffPath) {
    const activeRole = pickActiveRole()
    if (activeRole) return readRoleToken(activeRole)
    return sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  }

  // ---- Customer / public / không rõ role ----
  const activeRole = pickActiveRole()
  if (activeRole === 'ADMIN') return readRoleToken('ADMIN')
  if (activeRole === 'STAFF') return readRoleToken('STAFF')
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
  return readRoleToken(role)
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
