export const STAFF_SESSION_STORAGE_KEY = 'carivo-staff-session'
export const ADMIN_SESSION_STORAGE_KEY = 'carivo-admin-session'
export const STAFF_ACCESS_TOKEN_STORAGE_KEY = 'carivo-staff-access-token'
export const ADMIN_ACCESS_TOKEN_STORAGE_KEY = 'carivo-admin-access-token'
/**
 * @deprecated Fallback key cho code cũ. Một số module FE vẫn đọc key này khi
 * tách role bị miss. Các role-based flows mới phải dùng 2 key phía trên.
 */
export const ACCESS_TOKEN_STORAGE_KEY = 'carivo-access-token'
