import { CheckCircle2, Clock, History, XCircle, AlertTriangle } from 'lucide-react'
import type { ApiPaymentTransaction } from '../../../types/api/staff'
import {
  ADMIN_PAYMENT_INITIATOR_ROLE_LABELS,
} from '../../../constants/adminPayment'
import { formatDateTime } from '../../../utils/format'

interface AdminPaymentAuditTrailProps {
  payment: ApiPaymentTransaction
}

const EVENT_META: Record<
  string,
  { icon: typeof CheckCircle2; tone: string; label: string }
> = {
  CONFIRMED: {
    icon: CheckCircle2,
    tone: 'text-emerald-600',
    label: 'Thanh toán thành công',
  },
  FAILED: {
    icon: AlertTriangle,
    tone: 'text-red-600',
    label: 'Thanh toán thất bại',
  },
  CANCELED: {
    icon: XCircle,
    tone: 'text-rose-600',
    label: 'Đã huỷ',
  },
  EXPIRED: {
    icon: Clock,
    tone: 'text-slate-500',
    label: 'Hết hạn',
  },
}

export function AdminPaymentAuditTrail({ payment }: AdminPaymentAuditTrailProps) {
  const events: Array<{
    at: string
    title: string
    description?: string
    meta?: { icon: typeof CheckCircle2; tone: string }
  }> = []

  // Timeline theo status hiện tại + audit[]
  events.push({
    at: payment.created_at,
    title: 'Khởi tạo giao dịch',
    description: payment.initiator
      ? `Bởi ${ADMIN_PAYMENT_INITIATOR_ROLE_LABELS[payment.initiator.actor_type] ?? payment.initiator.actor_type}${
          payment.initiator.actor_name ? ` (${payment.initiator.actor_name})` : ''
        }`
      : 'Hệ thống',
    meta: { icon: History, tone: 'text-slate-500' },
  })

  if (payment.paid_at) {
    events.push({
      at: payment.paid_at,
      title: 'Đã ghi nhận thanh toán',
      description: 'Webhook PayOS xác nhận giao dịch.',
      meta: EVENT_META.CONFIRMED
        ? { icon: CheckCircle2, tone: 'text-emerald-600' }
        : undefined,
    })
  }

  if (payment.canceled_at) {
    events.push({
      at: payment.canceled_at,
      title: 'Đã huỷ giao dịch',
      meta: EVENT_META.CANCELED
        ? { icon: XCircle, tone: 'text-rose-600' }
        : undefined,
    })
  }

  if (payment.expired_at) {
    events.push({
      at: payment.expired_at,
      title: 'Đã hết hạn',
      meta: EVENT_META.EXPIRED
        ? { icon: Clock, tone: 'text-slate-500' }
        : undefined,
    })
  }

  // Append audit[] nếu có
  for (const audit of payment.audit ?? []) {
    const meta = EVENT_META[audit.event] ?? {
      icon: History,
      tone: 'text-slate-500',
      label: audit.event,
    }
    events.push({
      at: audit.at,
      title: meta.label,
      description: audit.note ?? audit.by ?? undefined,
      meta: { icon: meta.icon, tone: meta.tone },
    })
  }

  // Sort ascending
  events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-5">
      {events.map((event, idx) => {
        const Icon = event.meta?.icon ?? History
        const tone = event.meta?.tone ?? 'text-slate-500'
        return (
          <li key={idx} className="relative">
            <span
              className={`absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-slate-200 ${tone}`}
            >
              <Icon className="h-3 w-3" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-900">{event.title}</p>
              {event.description ? (
                <p className="text-xs text-slate-500">{event.description}</p>
              ) : null}
              <p className="mt-0.5 text-xs text-slate-400">
                {formatDateTime(event.at)}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
