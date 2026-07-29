import {
  Loader2,
  MessageSquareReply,
  MessagesSquare,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../../api/client'
import { ReviewCard } from '../../../components/reviews/ReviewCard'
import { CopyValueButton } from '../../../components/ui/CopyValueButton'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Label } from '../../../components/ui/Label'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { Textarea } from '../../../components/ui/Textarea'
import { PageHeader } from '../../../components/layout/PageHeader'
import { useToast } from '../../../contexts/ToastContext'
import {
  useDeleteStaffReviewReply,
  useReplyStaffReview,
  useStaffReviews,
} from '../../../hooks/api/useReviews'
import { useCanStaffCapability } from '../../../hooks/api/staff/useStaffCapabilities'
import type { Review, ReviewModerationStatus } from '../../../types/review'

export function StaffReviewsPage() {
  const { showToast } = useToast()
  const { can } = useCanStaffCapability()
  const [page, setPage] = useState(1)
  const [garageRating, setGarageRating] = useState('ALL')
  const [moderationStatus, setModerationStatus] = useState<
    ReviewModerationStatus | 'ALL'
  >('ALL')
  const [replyState, setReplyState] = useState<'ALL' | 'REPLIED' | 'PENDING'>(
    'ALL',
  )
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [deletingReview, setDeletingReview] = useState<Review | null>(null)
  const [replyContent, setReplyContent] = useState('')

  const params = useMemo(
    () => ({
      page,
      limit: 12,
      garage_rating:
        garageRating === 'ALL' ? undefined : Number(garageRating),
      moderation_status:
        moderationStatus === 'ALL' ? undefined : moderationStatus,
      has_reply:
        replyState === 'ALL' ? undefined : replyState === 'REPLIED',
    }),
    [garageRating, moderationStatus, page, replyState],
  )
  const reviewsQuery = useStaffReviews(params)
  const replyMutation = useReplyStaffReview()
  const deleteReplyMutation = useDeleteStaffReviewReply()
  const reviews = reviewsQuery.data?.reviews ?? []
  const meta = reviewsQuery.data?.meta
  const pageReplyCount = reviews.filter((review) => review.garage_reply).length
  const pageLowRatingCount = reviews.filter(
    (review) => review.garage_rating <= 2 || review.service_rating <= 2,
  ).length
  const canReply = can('review.reply_garage')

  const openReply = (review: Review) => {
    setEditingReview(review)
    setReplyContent(review.garage_reply?.content ?? '')
  }

  const closeReply = () => {
    setEditingReview(null)
    setReplyContent('')
  }

  const submitReply = async () => {
    if (!editingReview) return
    const content = replyContent.trim()
    if (content.length < 2) {
      showToast('Phản hồi cần có ít nhất 2 ký tự.', 'error')
      return
    }

    try {
      await replyMutation.mutateAsync({
        reviewId: editingReview.id,
        content,
      })
      showToast(
        editingReview.garage_reply
          ? 'Đã cập nhật phản hồi của garage.'
          : 'Đã gửi phản hồi của garage.',
        'success',
      )
      closeReply()
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể lưu phản hồi đánh giá.'),
        'error',
      )
    }
  }

  const deleteReply = async () => {
    if (!deletingReview) return

    try {
      await deleteReplyMutation.mutateAsync(deletingReview.id)
      showToast('Đã xóa phản hồi của garage.', 'success')
      setDeletingReview(null)
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể xóa phản hồi đánh giá.'),
        'error',
      )
    }
  }

  if (reviewsQuery.isLoading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div>
      <PageHeader
        title="Đánh giá khách hàng"
        description="Theo dõi phản hồi đã xác minh của khách hàng và gửi câu trả lời chính thức từ garage."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng đánh giá"
          value={meta?.total ?? 0}
          icon={MessagesSquare}
          accent="brand"
        />
        <StatCard
          label="Đã phản hồi trên trang"
          value={pageReplyCount}
          icon={MessageSquareReply}
          accent="emerald"
        />
        <StatCard
          label="Chưa phản hồi trên trang"
          value={reviews.length - pageReplyCount}
          icon={Pencil}
          accent="amber"
        />
        <StatCard
          label="Điểm thấp trên trang"
          value={pageLowRatingCount}
          icon={Star}
          accent="red"
          hint="Garage hoặc dịch vụ từ 2 sao trở xuống"
        />
      </div>

      <Card className="mb-6">
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="staff-review-rating">Điểm garage</Label>
            <Select
              id="staff-review-rating"
              value={garageRating}
              onChange={(event) => {
                setPage(1)
                setGarageRating(event.target.value)
              }}
            >
              <option value="ALL">Tất cả điểm</option>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} sao
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="staff-review-status">Trạng thái công khai</Label>
            <Select
              id="staff-review-status"
              value={moderationStatus}
              onChange={(event) => {
                setPage(1)
                setModerationStatus(
                  event.target.value as ReviewModerationStatus | 'ALL',
                )
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PUBLISHED">Đang công khai</option>
              <option value="HIDDEN">Đã bị ẩn</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="staff-review-reply">Phản hồi garage</Label>
            <Select
              id="staff-review-reply"
              value={replyState}
              onChange={(event) => {
                setPage(1)
                setReplyState(
                  event.target.value as 'ALL' | 'REPLIED' | 'PENDING',
                )
              }}
            >
              <option value="ALL">Tất cả</option>
              <option value="PENDING">Chưa phản hồi</option>
              <option value="REPLIED">Đã phản hồi</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {reviewsQuery.isError ? (
        <Card>
          <EmptyState
            icon={MessagesSquare}
            title="Không tải được đánh giá"
            description={getApiErrorMessage(
              reviewsQuery.error,
              'Vui lòng thử tải lại trang.',
            )}
            action={
              <Button onClick={() => void reviewsQuery.refetch()}>
                Thử lại
              </Button>
            }
          />
        </Card>
      ) : reviews.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessagesSquare}
            title="Không có đánh giá phù hợp"
            description="Hãy thay đổi bộ lọc hoặc chờ khách hàng gửi đánh giá mới."
          />
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showStatus
              actions={
                <div className="flex flex-wrap justify-end gap-1">
                  {review.booking_id ? (
                    <CopyValueButton
                      value={review.booking_id}
                      label="mã booking"
                      showLabel
                    />
                  ) : null}
                  {review.customer_id ? (
                    <CopyValueButton
                      value={review.customer_id}
                      label="ID khách hàng"
                      showLabel
                    />
                  ) : null}
                  {canReply ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openReply(review)}
                    >
                      <MessageSquareReply className="h-4 w-4" />
                      {review.garage_reply ? 'Sửa phản hồi' : 'Phản hồi'}
                    </Button>
                  ) : null}
                  {canReply && review.garage_reply ? (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeletingReview(review)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </Button>
                  ) : null}
                </div>
              }
            />
          ))}
        </div>
      )}

      {(meta?.total_pages ?? 1) > 1 ? (
        <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
          <Button
            size="sm"
            variant="secondary"
            disabled={page <= 1 || reviewsQuery.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Trang trước
          </Button>
          <span>
            Trang {meta?.page ?? page} / {meta?.total_pages ?? 1}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={
              page >= (meta?.total_pages ?? 1) || reviewsQuery.isFetching
            }
            onClick={() =>
              setPage((current) =>
                Math.min(meta?.total_pages ?? current, current + 1),
              )
            }
          >
            Trang sau
          </Button>
        </div>
      ) : null}

      <Modal
        open={Boolean(editingReview)}
        onClose={closeReply}
        title={editingReview?.garage_reply ? 'Sửa phản hồi' : 'Phản hồi đánh giá'}
        description="Phản hồi này sẽ được hiển thị công khai dưới đánh giá của khách hàng."
      >
        <Label htmlFor="review-reply" required>
          Nội dung phản hồi
        </Label>
        <Textarea
          id="review-reply"
          value={replyContent}
          maxLength={1000}
          rows={6}
          onChange={(event) => setReplyContent(event.target.value)}
          placeholder="Cảm ơn khách hàng và phản hồi cụ thể về trải nghiệm..."
        />
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>Tối đa 1.000 ký tự</span>
          <span>{replyContent.length}/1000</span>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={closeReply}>
            Hủy
          </Button>
          <Button
            onClick={() => void submitReply()}
            disabled={replyMutation.isPending}
          >
            {replyMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquareReply className="h-4 w-4" />
            )}
            Lưu phản hồi
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(deletingReview)}
        onClose={() => setDeletingReview(null)}
        title="Xóa phản hồi của garage?"
        description="Đánh giá của khách hàng vẫn được giữ nguyên."
      >
        <p className="text-sm leading-6 text-slate-600">
          Phản hồi hiện tại sẽ bị gỡ khỏi phần đánh giá công khai. Staff có thể
          tạo phản hồi mới sau đó.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeletingReview(null)}>
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={() => void deleteReply()}
            disabled={deleteReplyMutation.isPending}
          >
            {deleteReplyMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Xóa phản hồi
          </Button>
        </div>
      </Modal>
    </div>
  )
}
