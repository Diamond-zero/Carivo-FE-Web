import { Copy, ExternalLink, QrCode } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../ui/Card'
import { useToast } from '../../../contexts/ToastContext'
import type { ApiPaymentTransaction } from '../../../types/api/staff'
import {
  ADMIN_PAYMENT_CHANNEL_LABELS,
  ADMIN_PAYMENT_INITIATOR_ROLE_LABELS,
  ADMIN_PAYMENT_METHOD_LABELS,
  ADMIN_PAYMENT_PROVIDER_LABELS,
} from '../../../constants/adminPayment'
import { formatDateTime, formatPrice } from '../../../utils/format'
import { AdminPaymentStatusBadge } from './AdminPaymentStatusBadge'

interface AdminPaymentDetailCardProps {
  payment: ApiPaymentTransaction
}

export function AdminPaymentDetailCard({ payment }: AdminPaymentDetailCardProps) {
  const { showToast } = useToast()
  const [qrOpen, setQrOpen] = useState(false)

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      showToast('Trình duyệt không hỗ trợ copy.', 'error')
      return
    }
    void navigator.clipboard
      .writeText(text)
      .then(() => showToast(`Đã copy ${label}.`, 'success'))
      .catch(() => showToast('Copy thất bại.', 'error'))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-brand-600" />
              Giao dịch PayOS
            </CardTitle>
            <p className="mt-1 font-mono text-xs text-slate-500">
              #{payment.id} · order_code {payment.order_code}
            </p>
          </div>
          <AdminPaymentStatusBadge status={payment.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Số tiền">
            <span className="text-lg font-bold text-slate-900">
              {formatPrice(payment.amount)}
            </span>
          </Field>
          <Field label="Phương thức">
            {ADMIN_PAYMENT_PROVIDER_LABELS[payment.provider] ?? payment.provider} ·{' '}
            {ADMIN_PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
          </Field>
          <Field label="Mô tả">{payment.description ?? '—'}</Field>
          <Field label="Kênh khởi tạo">
            {payment.initiator?.source
              ? ADMIN_PAYMENT_CHANNEL_LABELS[payment.initiator.source] ??
                payment.initiator.source
              : '—'}
          </Field>
          <Field label="Người khởi tạo">
            {payment.initiator
              ? `${ADMIN_PAYMENT_INITIATOR_ROLE_LABELS[payment.initiator.actor_type] ?? payment.initiator.actor_type}${
                  payment.initiator.actor_name
                    ? ` · ${payment.initiator.actor_name}`
                    : ''
                }`
              : '—'}
          </Field>
          <Field label="Booking liên kết">
            <span className="font-mono text-xs">
              {payment.booking_id.replace('booking-', 'BK-')}
            </span>
          </Field>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <Field label="PayOS checkout URL">
            <div className="flex items-center gap-2">
              <a
                href={payment.checkout_url}
                target="_blank"
                rel="noopener noreferrer"
                className="carivo-link break-all text-xs"
              >
                {payment.checkout_url}
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(payment.checkout_url, 'link PayOS')}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <a
                href={payment.checkout_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-600 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </Field>

          {payment.qr_code ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                QR Code
              </p>
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setQrOpen(true)}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white p-2 transition hover:border-brand-300"
                >
                  <img
                    src={payment.qr_code}
                    alt="PayOS QR"
                    className="h-24 w-24"
                  />
                </button>
                <div className="text-xs text-slate-500">
                  <p>Bấm vào QR để phóng to.</p>
                  <p className="mt-1">
                    Hoặc dán URL ở trên vào trình duyệt / app ngân hàng.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Khởi tạo">{formatDateTime(payment.created_at)}</Field>
          <Field label="Cập nhật">{formatDateTime(payment.updated_at)}</Field>
          {payment.paid_at ? (
            <Field label="Thanh toán lúc">{formatDateTime(payment.paid_at)}</Field>
          ) : null}
          {payment.expires_at ? (
            <Field label="Hết hạn lúc">{formatDateTime(payment.expires_at)}</Field>
          ) : null}
          {payment.canceled_at ? (
            <Field label="Huỷ lúc">{formatDateTime(payment.canceled_at)}</Field>
          ) : null}
          {payment.expired_at ? (
            <Field label="Hết hạn (ghi nhận) lúc">
              {formatDateTime(payment.expired_at)}
            </Field>
          ) : null}
        </div>
      </CardContent>

      {qrOpen && payment.qr_code ? (
        <QrLightbox src={payment.qr_code} onClose={() => setQrOpen(false)} />
      ) : null}
    </Card>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="text-sm text-slate-800">{children}</div>
    </div>
  )
}

function QrLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="rounded-2xl bg-white p-4 shadow-2xl">
        <img src={src} alt="PayOS QR" className="h-[60vh] w-[60vh] max-w-full" />
      </div>
    </div>
  )
}
