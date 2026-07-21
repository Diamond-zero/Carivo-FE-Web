import { ArrowLeft, ClipboardList, Loader2, Play, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../api/client'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { Label } from '../../components/ui/Label'
import { useToast } from '../../contexts/ToastContext'
import {
  useAssignTechnicalAssessmentMutation,
  useMyTechnicalAssessment,
  useStartTechnicalAssessmentMutation,
  useSubmitTechnicalAssessmentMutation,
} from '../../hooks/api/staff/useStaffCustomerCases'
import { formatDateTime } from '../../utils/format'

const ASSESSMENT_STATUS_LABELS: Record<string, string> = {
  PENDING_ASSIGN: 'Chờ phân công inspector',
  ASSIGNED: 'Đã phân công',
  IN_PROGRESS: 'Đang đánh giá',
  SUBMITTED: 'Đã nộp kết quả',
}

const ASSESSMENT_STATUS_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  PENDING_ASSIGN: 'warning',
  ASSIGNED: 'info',
  IN_PROGRESS: 'info',
  SUBMITTED: 'success',
}

export function StaffTechnicalAssessmentPage() {
  const { caseId } = useParams()
  const { showToast } = useToast()

  const assessmentQuery = useMyTechnicalAssessment(caseId)
  const assignMutation = useAssignTechnicalAssessmentMutation(caseId ?? '')
  const startMutation = useStartTechnicalAssessmentMutation(caseId ?? '')
  const submitMutation = useSubmitTechnicalAssessmentMutation(caseId ?? '')

  const [inspectorId, setInspectorId] = useState('')
  const [findings, setFindings] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [evidenceIdsInput, setEvidenceIdsInput] = useState('')

  useEffect(() => {
    if (assessmentQuery.isError) {
      showToast(
        getApiErrorMessage(assessmentQuery.error, 'Không tải được đánh giá kỹ thuật.'),
        'error',
      )
    }
  }, [assessmentQuery.isError, assessmentQuery.error, showToast])

  if (assessmentQuery.isLoading) return <DashboardPageSkeleton />
  if (!assessmentQuery.data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Không có đánh giá kỹ thuật
        </h1>
        <Link to={`/staff/cases/${caseId}`} className="mt-4">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Quay lại hồ sơ
          </Button>
        </Link>
      </div>
    )
  }

  const assessment = assessmentQuery.data
  const status = assessment.status
  const statusLabel = ASSESSMENT_STATUS_LABELS[status] ?? status
  const isMutating =
    assignMutation.isPending || startMutation.isPending || submitMutation.isPending

  const handleAssign = async () => {
    if (!inspectorId.trim()) {
      showToast('Vui lòng nhập ID inspector.', 'error')
      return
    }
    try {
      await assignMutation.mutateAsync({
        assigned_inspector_id: inspectorId.trim(),
      })
      showToast('Đã phân công inspector.', 'success')
      setInspectorId('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể phân công.'), 'error')
    }
  }

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync({})
      showToast('Đã bắt đầu đánh giá.', 'success')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể bắt đầu.'), 'error')
    }
  }

  const handleSubmit = async () => {
    if (!findings.trim()) {
      showToast('Vui lòng nhập kết luận đánh giá.', 'error')
      return
    }
    const evidenceIds = evidenceIdsInput
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
    try {
      await submitMutation.mutateAsync({
        findings: findings.trim(),
        recommendation: recommendation.trim() || undefined,
        evidence_ids: evidenceIds,
      })
      showToast('Đã nộp kết quả đánh giá.', 'success')
      setFindings('')
      setRecommendation('')
      setEvidenceIdsInput('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể nộp đánh giá.'), 'error')
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          to={`/staff/cases/${caseId}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại hồ sơ
        </Link>
      </div>

      <PageHeader
        eyebrow="Carivo Staff"
        title="Đánh giá kỹ thuật"
        description="Phân công inspector, bắt đầu và nộp kết quả đánh giá kỹ thuật cho hồ sơ khiếu nại."
        action={
          <Badge variant={ASSESSMENT_STATUS_VARIANT[status] ?? 'default'}>
            {statusLabel}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin đánh giá</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Inspector phụ trách" value={assessment.assigned_inspector_name ?? assessment.assigned_inspector_id ?? 'Chưa phân công'} />
            <Row label="Bắt đầu" value={assessment.started_at ? formatDateTime(assessment.started_at) : '—'} />
            <Row label="Nộp kết quả" value={assessment.submitted_at ? formatDateTime(assessment.submitted_at) : '—'} />
            {assessment.findings ? (
              <div className="mt-2 rounded-xl bg-slate-50 p-3">
                <p className="mb-1 font-medium text-slate-700">Kết luận</p>
                <p className="text-slate-700">{assessment.findings}</p>
              </div>
            ) : null}
            {assessment.recommendation ? (
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="mb-1 font-medium text-slate-700">Đề xuất</p>
                <p className="text-slate-700">{assessment.recommendation}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-slate-500" />
              Hành động
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'PENDING_ASSIGN' ? (
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-700">Phân công inspector</p>
                <div>
                  <Label htmlFor="inspector-id" required>
                    ID inspector
                  </Label>
                  <input
                    id="inspector-id"
                    className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    placeholder="VD: staff-abc123"
                    value={inspectorId}
                    onChange={(event) => setInspectorId(event.target.value)}
                    disabled={isMutating}
                  />
                </div>
                <Button onClick={handleAssign} disabled={isMutating}>
                  {assignMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Phân công
                </Button>
              </div>
            ) : null}

            {status === 'ASSIGNED' ? (
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-700">Bắt đầu đánh giá</p>
                <Button onClick={handleStart} disabled={isMutating}>
                  {startMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Bắt đầu
                </Button>
              </div>
            ) : null}

            {status === 'IN_PROGRESS' ? (
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-700">Nộp kết quả</p>
                <div>
                  <Label htmlFor="findings" required>
                    Kết luận đánh giá
                  </Label>
                  <textarea
                    id="findings"
                    rows={4}
                    className="min-h-[100px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    placeholder="Mô tả chi tiết kết quả đánh giá kỹ thuật…"
                    value={findings}
                    onChange={(event) => setFindings(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="recommendation">Đề xuất hướng xử lý</Label>
                  <textarea
                    id="recommendation"
                    rows={3}
                    className="min-h-[80px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    placeholder="Đề xuất hướng xử lý tiếp theo…"
                    value={recommendation}
                    onChange={(event) => setRecommendation(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="evidence-ids">ID bằng chứng (phân tách dấu phẩy)</Label>
                  <input
                    id="evidence-ids"
                    className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    placeholder="evidence-id-1, evidence-id-2"
                    value={evidenceIdsInput}
                    onChange={(event) => setEvidenceIdsInput(event.target.value)}
                  />
                </div>
                <Button onClick={handleSubmit} disabled={isMutating}>
                  {submitMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Nộp kết quả
                </Button>
              </div>
            ) : null}

            {status === 'SUBMITTED' ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Đánh giá đã được nộp. Hệ thống sẽ cập nhật trạng thái hồ sơ.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900 text-right">{value}</dd>
    </div>
  )
}