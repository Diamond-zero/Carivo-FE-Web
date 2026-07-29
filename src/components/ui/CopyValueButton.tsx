import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { cn } from '../../lib/utils'
import { Button } from './Button'

interface CopyValueButtonProps {
  value: string
  label: string
  showLabel?: boolean
  className?: string
}

async function writeToClipboard(value: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  try {
    textarea.select()
    if (!document.execCommand('copy')) {
      throw new Error('COPY_FAILED')
    }
  } finally {
    document.body.removeChild(textarea)
  }
}

export function CopyValueButton({
  value,
  label,
  showLabel = false,
  className,
}: CopyValueButtonProps) {
  const { showToast } = useToast()
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (resetTimer.current) {
        window.clearTimeout(resetTimer.current)
      }
    },
    [],
  )

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()

    if (!value || typeof navigator === 'undefined') {
      showToast('Trình duyệt không hỗ trợ sao chép.', 'error')
      return
    }

    try {
      await writeToClipboard(value)
      setCopied(true)
      showToast(`Đã sao chép ${label}.`, 'success')

      if (resetTimer.current) {
        window.clearTimeout(resetTimer.current)
      }
      resetTimer.current = window.setTimeout(() => setCopied(false), 1800)
    } catch {
      showToast(`Không thể sao chép ${label}.`, 'error')
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('h-7 shrink-0 gap-1 px-2 text-xs', className)}
      onClick={handleCopy}
      aria-label={copied ? `Đã sao chép ${label}` : `Sao chép ${label}`}
      title={copied ? `Đã sao chép ${label}` : `Sao chép ${label}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {showLabel ? (copied ? 'Đã sao chép' : 'Sao chép') : null}
    </Button>
  )
}
