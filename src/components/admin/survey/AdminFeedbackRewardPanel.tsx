import {
  BellRing,
  ClipboardCheck,
  Coins,
  Loader2,
  MessageSquareWarning,
  Save,
  Star,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../../api/client'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminFeedbackRewardAnalytics,
  useAdminFeedbackRewardRule,
  useUpdateAdminFeedbackRewardRule,
} from '../../../hooks/api/admin/useAdminFeedbackRewards'
import { formatCurrency } from '../../../lib/utils'
import { Button } from '../../ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/Card'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { StatCard } from '../../ui/StatCard'

interface RewardFormState {
  survey_points: number
  review_points: number
  review_window_days: number
  reminder_after_hours: number
  count_toward_tier: boolean
  is_active: boolean
}

const EMPTY_FORM: RewardFormState = {
  survey_points: 50,
  review_points: 50,
  review_window_days: 30,
  reminder_after_hours: 48,
  count_toward_tier: false,
  is_active: true,
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatRating(value: number | null) {
  return value === null ? 'Chưa có' : `${value.toFixed(2)}/5`
}

export function AdminFeedbackRewardPanel() {
  const { showToast } = useToast()
  const [form, setForm] = useState<RewardFormState>(EMPTY_FORM)
  const analyticsParams = useMemo(() => {
    const to = new Date()
    const from = new Date(to)
    from.setDate(from.getDate() - 30)
    return {
      from: from.toISOString(),
      to: to.toISOString(),
    }
  }, [])
  const ruleQuery = useAdminFeedbackRewardRule()
  const analyticsQuery = useAdminFeedbackRewardAnalytics(analyticsParams)
  const updateMutation = useUpdateAdminFeedbackRewardRule()

  useEffect(() => {
    if (!ruleQuery.data) return
    setForm({
      survey_points: ruleQuery.data.survey_points,
      review_points: ruleQuery.data.review_points,
      review_window_days: ruleQuery.data.review_window_days,
      reminder_after_hours: ruleQuery.data.reminder_after_hours,
      count_toward_tier: ruleQuery.data.count_toward_tier,
      is_active: ruleQuery.data.is_active,
    })
  }, [ruleQuery.data])

  const updateNumber = (field: keyof RewardFormState, value: string) => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return
    setForm((current) => ({ ...current, [field]: parsed }))
  }

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(form)
      showToast('Đã cập nhật chính sách thưởng phản hồi.', 'success')
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể cập nhật chính sách thưởng phản hồi.'),
        'error',
      )
    }
  }

  const analytics = analyticsQuery.data
  const isLoading = ruleQuery.isLoading || analyticsQuery.isLoading
  const loadError = ruleQuery.error ?? analyticsQuery.error

  return (
    <div className="mb-6 space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Thưởng phản hồi sau dịch vụ</CardTitle>
            <CardDescription>
              Mỗi booking chỉ nhận thưởng một lần cho khảo sát và một lần cho đánh giá,
              không phụ thuộc số sao.
            </CardDescription>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              form.is_active
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {form.is_active ? 'Đang áp dụng' : 'Đang tạm dừng'}
          </span>
        </CardHeader>
        <CardContent>
          {ruleQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <Label htmlFor="feedback-survey-points">Điểm khảo sát</Label>
                  <Input
                    id="feedback-survey-points"
                    type="number"
                    min={0}
                    max={100}
                    value={form.survey_points}
                    onChange={(event) =>
                      updateNumber('survey_points', event.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="feedback-review-points">Điểm đánh giá</Label>
                  <Input
                    id="feedback-review-points"
                    type="number"
                    min={0}
                    max={100}
                    value={form.review_points}
                    onChange={(event) =>
                      updateNumber('review_points', event.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="feedback-review-window">Thời hạn đánh giá (ngày)</Label>
                  <Input
                    id="feedback-review-window"
                    type="number"
                    min={1}
                    max={365}
                    value={form.review_window_days}
                    onChange={(event) =>
                      updateNumber('review_window_days', event.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="feedback-reminder-hours">Nhắc lại sau (giờ)</Label>
                  <Input
                    id="feedback-reminder-hours"
                    type="number"
                    min={1}
                    max={720}
                    value={form.reminder_after_hours}
                    onChange={(event) =>
                      updateNumber('reminder_after_hours', event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                    className="mt-0.5 h-4 w-4 accent-emerald-600"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Bật thưởng phản hồi
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Tắt chính sách sẽ không phát sinh điểm mới.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                  <input
                    type="checkbox"
                    checked={form.count_toward_tier}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        count_toward_tier: event.target.checked,
                      }))
                    }
                    className="mt-0.5 h-4 w-4 accent-amber-600"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-amber-900">
                      Tính vào điều kiện thăng hạng
                    </span>
                    <span className="mt-1 block text-xs text-amber-800">
                      Nên để tắt để hạng thành viên phản ánh giá trị dịch vụ đã mua.
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                <div>
                  <p
                    className={`text-sm ${
                      form.survey_points + form.review_points > 100
                        ? 'font-medium text-red-600'
                        : 'text-slate-500'
                    }`}
                  >
                    Tổng {form.survey_points + form.review_points}/100 điểm cho mỗi
                    booking.
                  </p>
                  {form.survey_points + form.review_points > 100 ? (
                    <p className="mt-1 text-xs text-red-600">
                      Tổng thưởng khảo sát và đánh giá không được vượt quá 100 điểm.
                    </p>
                  ) : null}
                </div>
                <Button
                  onClick={() => void handleSave()}
                  disabled={
                    updateMutation.isPending ||
                    form.survey_points + form.review_points > 100
                  }
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Lưu chính sách
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hiệu quả 30 ngày gần nhất</CardTitle>
          <CardDescription>
            Tỷ lệ mở được tính khi khách đánh dấu thông báo đã đọc. Điểm đã dùng là
            ước tính từ phần điểm thưởng không còn trong số dư nguồn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : loadError ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {getApiErrorMessage(loadError, 'Không tải được báo cáo thưởng phản hồi.')}
            </p>
          ) : analytics ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Mở lời mời"
                value={formatPercent(analytics.invitations.open_rate)}
                icon={BellRing}
                accent="brand"
                hint={`Khảo sát ${formatPercent(
                  analytics.invitations.survey.open_rate,
                )} · Đánh giá ${formatPercent(
                  analytics.invitations.review.open_rate,
                )}`}
              />
              <StatCard
                label="Hoàn thành khảo sát"
                value={analytics.completions.survey_responses}
                icon={ClipboardCheck}
                accent="emerald"
                hint={`${formatPercent(analytics.completions.survey_rate)} số lời mời`}
              />
              <StatCard
                label="Hoàn thành đánh giá"
                value={analytics.completions.reviews}
                icon={Star}
                accent="amber"
                hint={`${formatPercent(analytics.completions.review_rate)} số lời mời`}
              />
              <StatCard
                label="Điểm đã phát hành"
                value={analytics.rewards.total_points}
                icon={Coins}
                accent="violet"
                hint={`Ước tính đã dùng ${analytics.rewards.consumed_points_estimate} điểm`}
              />
              <StatCard
                label="Chi phí mỗi phản hồi"
                value={formatCurrency(analytics.rewards.estimated_cost_per_feedback)}
                icon={TrendingUp}
                accent="indigo"
                hint={`Tổng giá trị ${formatCurrency(
                  analytics.rewards.estimated_value_amount,
                )}`}
              />
              <StatCard
                label="NPS"
                value={analytics.quality.nps_score ?? 'Chưa có'}
                icon={TrendingUp}
                accent="emerald"
                hint={`${analytics.quality.nps_response_count} câu trả lời NPS`}
              />
              <StatCard
                label="Điểm trung bình"
                value={formatRating(analytics.quality.average_garage_rating)}
                icon={Star}
                accent="amber"
                hint={`Dịch vụ ${formatRating(
                  analytics.quality.average_service_rating,
                )}`}
              />
              <StatCard
                label="Kiểm duyệt"
                value={analytics.quality.hidden_reviews}
                icon={MessageSquareWarning}
                accent="rose"
                hint={`${analytics.quality.spam_reviews} đánh giá bị xác định spam`}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
