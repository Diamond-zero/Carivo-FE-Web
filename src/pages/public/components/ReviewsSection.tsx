import { MessageSquareText, ShieldCheck, Star } from 'lucide-react'
import { ReviewCard } from '../../../components/reviews/ReviewCard'
import { RatingStars } from '../../../components/reviews/RatingStars'
import { EmptyState } from '../../../components/ui/EmptyState'
import { usePublicReviewShowcase } from '../../../hooks/api/useReviews'

export function ReviewsSection() {
  const showcaseQuery = usePublicReviewShowcase()
  const showcase = showcaseQuery.data

  return (
    <section id="reviews" className="bg-slate-950 py-16 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-brand-300">
              Trải nghiệm đã xác minh
            </p>
            <h2 className="mt-2 text-3xl font-black">
              Khách hàng nói gì về Carivo
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Chỉ những khách hàng có booking đã hoàn thành và thanh toán mới có
              thể gửi đánh giá.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
              <Star className="h-6 w-6 fill-current" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black">
                  {showcaseQuery.isLoading
                    ? '...'
                    : showcase?.rating_average.toFixed(1) ?? '0.0'}
                </span>
                <RatingStars
                  value={showcase?.rating_average ?? 0}
                  size="md"
                  label="Điểm trung bình"
                />
              </div>
              <p className="text-xs text-slate-400">
                {showcase?.rating_count ?? 0} lượt đánh giá garage
              </p>
            </div>
          </div>
        </div>

        {showcaseQuery.isLoading ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-2xl bg-white/10"
              />
            ))}
          </div>
        ) : showcaseQuery.isError ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5">
            <EmptyState
              icon={ShieldCheck}
              title="Chưa thể tải đánh giá"
              description="Dữ liệu đánh giá đang tạm thời không khả dụng."
              className="text-slate-200 [&_h3]:text-white [&_p]:text-slate-400"
            />
          </div>
        ) : showcase && showcase.reviews.length > 0 ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {showcase.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5">
            <EmptyState
              icon={MessageSquareText}
              title="Chưa có đánh giá công khai"
              description="Đánh giá đã xác minh từ khách hàng sẽ xuất hiện tại đây."
              className="text-slate-200 [&_h3]:text-white [&_p]:text-slate-400"
            />
          </div>
        )}
      </div>
    </section>
  )
}
