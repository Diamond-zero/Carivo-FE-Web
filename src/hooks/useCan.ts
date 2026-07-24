/**
 * @deprecated Dùng `useMyCapabilities()` và `useCanStaffCapability()` từ
 * `hooks/api/staff/useStaffCapabilities.ts` thay vì file này.
 *
 * File này giữ lại để tránh break các import cũ, nhưng tất cả các
 * hook ở đây giờ trỏ tới API-driven capabilities thay vì hardcoded.
 */
import { useCanStaffCapability, useMyCapabilities } from './api/staff/useStaffCapabilities'
import type { StaffCapability } from '../constants/staffCapabilities'

export { useMyCapabilities, useCanStaffCapability }

/**
 * @deprecated Dùng `useMyCapabilities()` thay vì hook này.
 *
 * Hook kiểm tra Staff hiện tại có capability hay không.
 * Giờ dùng API `GET /staff-profiles/me/capabilities` thay vì hardcoded lookup.
 *
 * Truyền mảng → true nếu Staff có ÍT NHẤT 1 capability (OR logic).
 */
export function useCan(capability: StaffCapability | StaffCapability[]): boolean {
  const capabilities = useMyCapabilities()
  if (Array.isArray(capability)) {
    return capability.some((c) => capabilities.includes(c))
  }
  return capabilities.includes(capability)
}

/**
 * @deprecated Dùng `useMyCapabilities()` thay vì hook này.
 *
 * Hook lấy toàn bộ capability của Staff hiện tại.
 * Giờ dùng API `GET /staff-profiles/me/capabilities` thay vì hardcoded lookup.
 */
export { useMyCapabilities as useStaffCapabilities }
