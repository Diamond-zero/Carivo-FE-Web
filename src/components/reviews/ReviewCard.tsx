import { Building2, MessageSquareReply, Package } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Review } from '../../types/review'
import { formatDateTime } from '../../utils/format'
import { Badge } from '../ui/Badge'
import { Card, CardContent } from '../ui/Card'
import { RatingStars } from './RatingStars'

interface ReviewCardProps {
  review: Review
  actions?: ReactNode
  showStatus?: boolean
  showCustomerContact?: boolean
}

export function ReviewCard({
  review,
  actions,
  showStatus = false,
  showCustomerContact = false,
}: ReviewCardProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-slate-900">
                {review.customer?.full_name ?? 'Khách hàng'}
              </p>
              {review.is_anonymous ? <Badge>Ẩn danh</Badge> : null}
              {showStatus && review.moderation_status ? (
                <Badge
                  variant={
                    review.moderation_status === 'PUBLISHED'
                      ? 'success'
                      : 'danger'
                  }
                >
                  {review.moderation_status === 'PUBLISHED'
                    ? 'Đang công khai'
                    : 'Đã ẩn'}
                </Badge>
              ) : null}
            </div>
            {showCustomerContact && review.customer ? (
              <p className="mt-1 text-xs text-slate-500">
                {[review.customer.phone, review.customer.email]
                  .filter(Boolean)
                  .join(' · ') || 'Không có thông tin liên hệ'}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-slate-500">
              {formatDateTime(review.created_at)}
            </p>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>

        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Chất lượng garage
            </p>
            <RatingStars value={review.garage_rating} showValue label="Garage" />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Chất lượng dịch vụ
            </p>
            <RatingStars value={review.service_rating} showValue label="Dịch vụ" />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            {review.garage?.name ?? review.garage_id}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />
            {review.service_package?.name ?? review.service_package_id}
          </span>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {review.comment || 'Khách hàng không để lại bình luận.'}
        </p>

        {review.uploads.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {review.uploads.map((upload) => (
              <a
                key={upload.id}
                href={upload.url}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >
                <img
                  src={upload.url}
                  alt="Ảnh đánh giá của khách hàng"
                  className="h-32 w-full object-cover transition-transform hover:scale-105"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        ) : null}

        {review.garage_reply ? (
          <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-800">
              <MessageSquareReply className="h-4 w-4" />
              Phản hồi từ garage
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {review.garage_reply.content}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {formatDateTime(review.garage_reply.updated_at)}
            </p>
          </div>
        ) : null}

        {showStatus &&
        review.moderation_status === 'HIDDEN' &&
        review.moderation_reason ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">
              Lý do ẩn: {review.moderation_reason}
            </p>
            {review.moderation_note ? (
              <p className="mt-1">{review.moderation_note}</p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
