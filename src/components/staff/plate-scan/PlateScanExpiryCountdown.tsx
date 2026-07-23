// ============================================================================
// PlateScanExpiryCountdown — đếm ngược tới scan.expires_at.
//
// Phase 2.5: BE scheduler sẽ expire scan sau PLATE_SCAN_CONFIRM_EXPIRY_MINUTES
// (default 30 phút). Staff cần countdown để biết còn bao nhiêu thời gian để
// confirm. Sau khi expired → scan.status = 'EXPIRED' và FE disable actions.
// ============================================================================

import { useEffect, useState } from 'react'

import { Clock, AlertOctagon } from 'lucide-react'
import { Badge } from '../../ui/Badge'
import { cn } from '../../../lib/utils'

interface Props {
  expiresAt: string | null | undefined
  /** Hiển thị full datetime cạnh countdown. */
  showAbsolute?: boolean
  className?: string
}

const computeRemaining = (expiresAt: string) => {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.floor(diff / 1000))
}

const formatCountdown = (seconds: number) => {
  if (seconds <= 0) return 'Đã hết hạn'
  const mm = Math.floor(seconds / 60)
  const ss = seconds % 60
  if (mm >= 60) {
    const hh = Math.floor(mm / 60)
    const m = mm % 60
    return `${hh}h ${m.toString().padStart(2, '0')}m`
  }
  return `${mm}:${ss.toString().padStart(2, '0')}`
}

export function PlateScanExpiryCountdown({
  expiresAt,
  showAbsolute = true,
  className,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    expiresAt ? computeRemaining(expiresAt) : 0,
  )

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(0)
      return
    }
    setSecondsLeft(computeRemaining(expiresAt))
    const interval = setInterval(() => {
      const next = computeRemaining(expiresAt)
      setSecondsLeft(next)
      if (next <= 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  if (!expiresAt) return null

  const isExpired = secondsLeft <= 0
  const isCritical = secondsLeft > 0 && secondsLeft < 5 * 60 // < 5 phút

  return (
    <Badge
      variant={isExpired ? 'danger' : isCritical ? 'warning' : 'default'}
      className={cn(
        'font-mono tabular-nums',
        isCritical && !isExpired ? 'animate-pulse' : '',
        className,
      )}
      aria-live="polite"
    >
      {isExpired ? (
        <>
          <AlertOctagon className="mr-1 h-3 w-3" />
          Đã hết hạn
        </>
      ) : (
        <>
          <Clock className="mr-1 h-3 w-3" />
          {formatCountdown(secondsLeft)}
          {showAbsolute ? (
            <span className="ml-1 font-sans font-normal opacity-70">
              ·{' '}
              {new Date(expiresAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          ) : null}
        </>
      )}
    </Badge>
  )
}