import type { ReactNode } from 'react'
import {
  type StaffCapability,
} from '../../constants/staffCapabilities'
import { useCan } from '../../hooks/useCan'

interface CanProps {
  capability: StaffCapability
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Bọc UI — chỉ render `children` nếu Staff hiện tại có capability tương ứng.
 * Có thể truyền `fallback` (mặc định `null`).
 */
export function Can({ capability, children, fallback = null }: CanProps) {
  const allowed = useCan(capability)
  return allowed ? <>{children}</> : <>{fallback}</>
}
