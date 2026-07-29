import {
  BarChart3,
  Eye,
  EyeOff,
  Loader2,
  MessageSquareReply,
  MessagesSquare,
  Search,
  Star,
  TriangleAlert,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../../api/client'
import { PageHeader } from '../../../components/layout/PageHeader'
import { RatingStars } from '../../../components/reviews/RatingStars'
import { ReviewCard } from '../../../components/reviews/ReviewCard'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { CopyValueButton } from '../../../components/ui/CopyValueButton'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { Textarea } from '../../../components/ui/Textarea'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminReviewAnalytics,
  useAdminReviews,
  useModerateAdminReview,
} from '../../../hooks/api/useReviews'
import { useAdminGarages } from '../../../hooks/api/admin/useAdminGarages'
import { useAdminServicePackages } from '../../../hooks/api/admin/useAdminServicePackages'
import type {
  Review,
  ReviewDistribution,
  ReviewModerationReason,
  ReviewModerationStatus,
} from '../../../types/review'

const MODERATION_REASON_LABELS: Record<ReviewModerationReason, string> = {
  INAPPROPRIATE_LANGUAGE: 'Ngôn từ không phù hợp',
  PERSONAL_INFORMATION: 'Có thông tin cá nhân',
  SPAM: 'Spam hoặc nội dung lặp lại',
  OFF_TOPIC: 'Không liên quan đến dịch vụ',
  FRAUD: 'Có dấu hiệu gian lận',
  OTHER: 'Lý do khác',
}

function toDateTime(value: string, endOfDay = false) {
  if (!value) return undefined
  const time = endOfDay ? '23:59:59.999' : '00:00:00.000'
  return new Date(`${value}T${time}`).toISOString()
}

function RatingDistributionCard({
  title,
  distribution,
}: {
  title: string
  distribution: ReviewDistribution
}) {
  const total = Object.values(distribution).reduce(
    (sum, count) => sum + count,
    0,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = distribution[rating as keyof ReviewDistribution]
          const percentage = total > 0 ? (count / total) * 100 : 0

          return (
            <div key={rating} className="grid grid-cols-[52px_1fr_36px] items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">
                {rating} sao
              </span>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-right text-sm text-slate-500">{count}</span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function AdminReviewsPage() {
  const { showToast } = useToast()
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [garageId, setGarageId] = useState('ALL')
  const [servicePackageId, setServicePackageId] = useState('ALL')
  const [status, setStatus] =
    useState<ReviewModerationStatus>('PUBLISHED')
  const [garageRating, setGarageRating] = useState('ALL')
  const [replyState, setReplyState] = useState<'ALL' | 'REPLIED' | 'PENDING'>(
    'ALL',
  )
  const [anonymousState, setAnonymousState] = useState<
    'ALL' | 'ANONYMOUS' | 'IDENTIFIED'
  >('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [moderatingReview, setModeratingReview] = useState<Review | null>(null)
  const [moderationReason, setModerationReason] =
    useState<ReviewModerationReason>('INAPPROPRIATE_LANGUAGE')
  const [moderationNote, setModerationNote] = useState('')

  const { allGarages } = useAdminGarages()
  const { allPackages } = useAdminServicePackages()
  const commonFilters = useMemo(
    () => ({
      garage_id: garageId === 'ALL' ? undefined : garageId,
      service_package_id:
        servicePackageId === 'ALL' ? undefined : servicePackageId,
      moderation_status: status,
      from: toDateTime(fromDate),
      to: toDateTime(toDate, true),
    }),
    [fromDate, garageId, servicePackageId, status, toDate],
  )
  const listParams = useMemo(
    () => ({
      ...commonFilters,
      page,
      limit: 12,
      search: search || undefined,
      garage_rating:
        garageRating === 'ALL' ? undefined : Number(garageRating),
      has_reply:
        replyState === 'ALL' ? undefined : replyState === 'REPLIED',
      is_anonymous:
        anonymousState === 'ALL'
          ? undefined
          : anonymousState === 'ANONYMOUS',
    }),
    [
      anonymousState,
      commonFilters,
      garageRating,
      page,
      replyState,
      search,
    ],
  )
  const reviewsQuery = useAdminReviews(listParams)
  const analyticsQuery = useAdminReviewAnalytics(commonFilters)
  const moderationMutation = useModerateAdminReview()
  const reviews = reviewsQuery.data?.reviews ?? []
  const meta = reviewsQuery.data?.meta
  const analytics = analyticsQuery.data

  const updateListFilter = (update: () => void) => {
    setPage(1)
    update()
  }

  const openHideModal = (review: Review) => {
    setModeratingReview(review)
    setModerationReason('INAPPROPRIATE_LANGUAGE')
    setModerationNote('')
  }

  const closeModerationModal = () => {
    setModeratingReview(null)
    setModerationNote('')
  }

  const hideReview = async () => {
    if (!moderatingReview) return
    if (moderationReason === 'OTHER' && !moderationNote.trim()) {
      showToast('Vui lòng nhập ghi chú cho lý do khác.', 'error')
      return
    }

    try {
      await moderationMutation.mutateAsync({
        reviewId: moderatingReview.id,
        payload: {
          status: 'HIDDEN',
          reason: moderationReason,
          note: moderationNote.trim() || null,
        },
      })
      showToast('Đã ẩn đánh giá khỏi khu vực công khai.', 'success')
      closeModerationModal()
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể ẩn đánh giá.'),
        'error',
      )
    }
  }

  const publishReview = async (review: Review) => {
    try {
      await moderationMutation.mutateAsync({
        reviewId: review.id,
        payload: {
          status: 'PUBLISHED',
          reason: null,
          note: null,
        },
      })
      showToast('Đã công khai lại đánh giá.', 'success')
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể công khai lại đánh giá.'),
        'error',
      )
    }
  }

  if (reviewsQuery.isLoading && analyticsQuery.isLoading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Đánh giá khách hàng"
        description="Kiểm duyệt đánh giá đã xác minh, theo dõi chất lượng garage, dịch vụ và tỷ lệ phản hồi."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Tổng đánh giá"
          value={analytics?.total ?? 0}
          icon={MessagesSquare}
          accent="brand"
          hint={status === 'PUBLISHED' ? 'Đang công khai' : 'Đang bị ẩn'}
        />
        <StatCard
          label="Điểm garage"
          value={(analytics?.garage_rating_average ?? 0).toFixed(1)}
          icon={Star}
          accent="amber"
          hint="Trung bình trên 5"
        />
        <StatCard
          label="Điểm dịch vụ"
          value={(analytics?.service_rating_average ?? 0).toFixed(1)}
          icon={Star}
          accent="violet"
          hint="Trung bình trên 5"
        />
        <StatCard
          label="Tỷ lệ phản hồi"
          value={`${(analytics?.response_rate ?? 0).toFixed(1)}%`}
          icon={MessageSquareReply}
          accent="emerald"
          hint={`${analytics?.replied_count ?? 0} đánh giá đã phản hồi`}
        />
        <StatCard
          label="Đánh giá điểm thấp"
          value={analytics?.low_rating_count ?? 0}
          icon={TriangleAlert}
          accent="red"
          hint="Garage hoặc dịch vụ ≤ 2 sao"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bộ lọc đánh giá</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              setPage(1)
              setSearch(searchInput.trim())
            }}
          >
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm nội dung, tên garage hoặc gói dịch vụ..."
              aria-label="Tìm đánh giá"
            />
            <Button type="submit" className="shrink-0">
              <Search className="h-4 w-4" />
              Tìm kiếm
            </Button>
          </form>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <Label htmlFor="admin-review-garage">Garage</Label>
              <Select
                id="admin-review-garage"
                value={garageId}
                onChange={(event) =>
                  updateListFilter(() => setGarageId(event.target.value))
                }
              >
                <option value="ALL">Tất cả garage</option>
                {allGarages.map((garage) => (
                  <option key={garage.id} value={garage.id}>
                    {garage.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="admin-review-service">Gói dịch vụ</Label>
              <Select
                id="admin-review-service"
                value={servicePackageId}
                onChange={(event) =>
                  updateListFilter(() =>
                    setServicePackageId(event.target.value),
                  )
                }
              >
                <option value="ALL">Tất cả gói dịch vụ</option>
                {allPackages.map((servicePackage) => (
                  <option key={servicePackage.id} value={servicePackage.id}>
                    {servicePackage.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="admin-review-status">Kiểm duyệt</Label>
              <Select
                id="admin-review-status"
                value={status}
                onChange={(event) =>
                  updateListFilter(() =>
                    setStatus(event.target.value as ReviewModerationStatus),
                  )
                }
              >
                <option value="PUBLISHED">Đang công khai</option>
                <option value="HIDDEN">Đã bị ẩn</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="admin-review-rating">Điểm garage</Label>
              <Select
                id="admin-review-rating"
                value={garageRating}
                onChange={(event) =>
                  updateListFilter(() => setGarageRating(event.target.value))
                }
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
              <Label htmlFor="admin-review-reply">Phản hồi garage</Label>
              <Select
                id="admin-review-reply"
                value={replyState}
                onChange={(event) =>
                  updateListFilter(() =>
                    setReplyState(
                      event.target.value as 'ALL' | 'REPLIED' | 'PENDING',
                    ),
                  )
                }
              >
                <option value="ALL">Tất cả</option>
                <option value="PENDING">Chưa phản hồi</option>
                <option value="REPLIED">Đã phản hồi</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="admin-review-anonymous">Danh tính</Label>
              <Select
                id="admin-review-anonymous"
                value={anonymousState}
                onChange={(event) =>
                  updateListFilter(() =>
                    setAnonymousState(
                      event.target.value as
                        | 'ALL'
                        | 'ANONYMOUS'
                        | 'IDENTIFIED',
                    ),
                  )
                }
              >
                <option value="ALL">Tất cả</option>
                <option value="IDENTIFIED">Có danh tính</option>
                <option value="ANONYMOUS">Ẩn danh</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="admin-review-from">Từ ngày</Label>
              <Input
                id="admin-review-from"
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) =>
                  updateListFilter(() => setFromDate(event.target.value))
                }
              />
            </div>
            <div>
              <Label htmlFor="admin-review-to">Đến ngày</Label>
              <Input
                id="admin-review-to"
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) =>
                  updateListFilter(() => setToDate(event.target.value))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {analyticsQuery.isError ? (
        <Card className="mb-6 border-red-200">
          <CardContent className="text-sm text-red-700">
            {getApiErrorMessage(
              analyticsQuery.error,
              'Không tải được thống kê đánh giá.',
            )}
          </CardContent>
        </Card>
      ) : analytics ? (
        <>
          <div className="mb-6 grid gap-4 xl:grid-cols-2">
            <RatingDistributionCard
              title="Phân bố điểm garage"
              distribution={analytics.garage_distribution}
            />
            <RatingDistributionCard
              title="Phân bố điểm dịch vụ"
              distribution={analytics.service_distribution}
            />
          </div>

          <div className="mb-6 grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top garage theo điểm đánh giá</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.top_garages.length > 0 ? (
                  analytics.top_garages.map((garage, index) => (
                    <div
                      key={garage.garage_id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {index + 1}. {garage.garage_name ?? garage.garage_code}
                        </p>
                        <p className="text-xs text-slate-500">
                          {garage.rating_count} đánh giá
                        </p>
                      </div>
                      <RatingStars
                        value={garage.rating_average}
                        showValue
                        label="Điểm garage"
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top dịch vụ theo điểm đánh giá</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.top_services.length > 0 ? (
                  analytics.top_services.map((service, index) => (
                    <div
                      key={service.service_package_id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {index + 1}.{' '}
                          {service.service_package_name ?? service.service_code}
                        </p>
                        <p className="text-xs text-slate-500">
                          {service.rating_count} đánh giá
                        </p>
                      </div>
                      <RatingStars
                        value={service.rating_average}
                        showValue
                        label="Điểm dịch vụ"
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">
          Danh sách đánh giá ({meta?.total ?? 0})
        </h2>
        {reviewsQuery.isFetching ? (
          <span className="inline-flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Đang đồng bộ
          </span>
        ) : null}
      </div>

      {reviewsQuery.isError ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="Không tải được danh sách đánh giá"
            description={getApiErrorMessage(
              reviewsQuery.error,
              'Vui lòng thử lại.',
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
            description="Không có dữ liệu trong phạm vi bộ lọc hiện tại."
          />
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showStatus
              showCustomerContact
              actions={
                <div className="flex flex-wrap justify-end gap-1">
                  <CopyValueButton
                    value={review.id}
                    label="ID đánh giá"
                    showLabel
                  />
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
                  {review.moderation_status === 'PUBLISHED' ? (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => openHideModal(review)}
                    >
                      <EyeOff className="h-4 w-4" />
                      Ẩn
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => void publishReview(review)}
                      disabled={moderationMutation.isPending}
                    >
                      <Eye className="h-4 w-4" />
                      Công khai lại
                    </Button>
                  )}
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
        open={Boolean(moderatingReview)}
        onClose={closeModerationModal}
        title="Ẩn đánh giá khỏi khu vực công khai"
        description="Nội dung gốc vẫn được lưu để phục vụ kiểm tra và audit."
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="moderation-reason" required>
              Lý do kiểm duyệt
            </Label>
            <Select
              id="moderation-reason"
              value={moderationReason}
              onChange={(event) =>
                setModerationReason(
                  event.target.value as ReviewModerationReason,
                )
              }
            >
              {Object.entries(MODERATION_REASON_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </Select>
          </div>
          <div>
            <Label
              htmlFor="moderation-note"
              required={moderationReason === 'OTHER'}
            >
              Ghi chú kiểm duyệt
            </Label>
            <Textarea
              id="moderation-note"
              value={moderationNote}
              maxLength={1000}
              rows={5}
              onChange={(event) => setModerationNote(event.target.value)}
              placeholder="Ghi lại căn cứ kiểm duyệt để dễ đối soát..."
            />
            <p className="mt-1 text-right text-xs text-slate-500">
              {moderationNote.length}/1000
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModerationModal}>
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={() => void hideReview()}
              disabled={moderationMutation.isPending}
            >
              {moderationMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              Xác nhận ẩn
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
