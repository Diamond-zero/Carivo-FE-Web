import {
  CAMERA_DEVICE_HEALTH_LABELS,
  CAMERA_DEVICE_STATUS_LABELS,
  PLATE_SCAN_STATUS_LABELS,
  PLATE_SCAN_STATUS_VARIANT,
} from '../../api/plateScan.api'
import { cn } from '../../lib/utils'
import type {
  CameraDeviceHealthStatus,
  CameraDeviceStatus,
  PlateScanStatus,
} from '../../types/api/plateScan'

const HEALTH_BADGE_CLASS: Record<CameraDeviceHealthStatus, string> = {
  ONLINE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  STALE: 'bg-amber-50 text-amber-700 ring-amber-200',
  OFFLINE: 'bg-rose-50 text-rose-700 ring-rose-200',
  DISABLED: 'bg-slate-100 text-slate-500 ring-slate-200',
}

const HEALTH_DOT_CLASS: Record<CameraDeviceHealthStatus, string> = {
  ONLINE: 'bg-emerald-500',
  STALE: 'bg-amber-500',
  OFFLINE: 'bg-rose-500',
  DISABLED: 'bg-slate-400',
}

const STATUS_BADGE_CLASS: Record<CameraDeviceStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  MAINTENANCE: 'bg-amber-50 text-amber-700',
  INACTIVE: 'bg-slate-100 text-slate-600',
  REVOKED: 'bg-rose-50 text-rose-700',
}

const SCAN_STATUS_BADGE: Record<string, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-sky-50 text-sky-700',
}

interface CameraHealthBadgeProps {
  health: CameraDeviceHealthStatus
  className?: string
}

export function CameraHealthBadge({ health, className }: CameraHealthBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1',
        HEALTH_BADGE_CLASS[health],
        className,
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', HEALTH_DOT_CLASS[health])} />
      {CAMERA_DEVICE_HEALTH_LABELS[health]}
    </span>
  )
}

interface CameraDeviceStatusBadgeProps {
  status: CameraDeviceStatus
  className?: string
}

export function CameraDeviceStatusBadge({
  status,
  className,
}: CameraDeviceStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_BADGE_CLASS[status],
        className,
      )}
    >
      {CAMERA_DEVICE_STATUS_LABELS[status]}
    </span>
  )
}

interface PlateScanStatusBadgeProps {
  status: PlateScanStatus
  className?: string
}

export function PlateScanStatusBadge({ status, className }: PlateScanStatusBadgeProps) {
  const variant = PLATE_SCAN_STATUS_VARIANT[status]
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        SCAN_STATUS_BADGE[variant],
        className,
      )}
    >
      {PLATE_SCAN_STATUS_LABELS[status]}
    </span>
  )
}
