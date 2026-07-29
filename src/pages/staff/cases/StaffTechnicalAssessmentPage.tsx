import { ArrowLeft, ClipboardList, Loader2, Play, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { uploadFileApi } from '../../../api/upload.api'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import {
  useMyTechnicalAssessment,
  useStartTechnicalAssessmentMutation,
  useSubmitTechnicalAssessmentMutation,
} from '../../../hooks/api/staff/useStaffCustomerCases'
import type { ApiSubmitTechnicalAssessmentPayload } from '../../../types/api/customerCase'
import { formatDateTime } from '../../../utils/format'

const ASSESSMENT_STATUS_LABELS: Record<string, string> = {
  ASSIGNED: 'Đã phân công',
  IN_PROGRESS: 'Đang đánh giá',
  SUBMITTED: 'Đã nộp kết quả',
}

const ASSESSMENT_STATUS_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  ASSIGNED: 'info',
  IN_PROGRESS: 'warning',
  SUBMITTED: 'success',
}

const SEVERITY_LABELS: Record<
  ApiSubmitTechnicalAssessmentPayload['severity'],
  string
> = {
  MINOR: 'Nhẹ',
  MODERATE: 'Trung bình',
  MAJOR: 'Nghiêm trọng',
  SAFETY_CRITICAL: 'Nguy hiểm an toàn',
}

export function StaffTechnicalAssessmentPage() {
  const { caseId } = useParams()
  const { showToast } = useToast()

  const assessmentQuery = useMyTechnicalAssessment(caseId)
  const startMutation = useStartTechnicalAssessmentMutation(caseId ?? '')
  const submitMutation = useSubmitTechnicalAssessmentMutation(caseId ?? '')

  const [findings, setFindings] = useState('')
  const [rootCause, setRootCause] = useState('')
  const [severity, setSeverity] =
    useState<ApiSubmitTechnicalAssessmentPayload['severity']>('MINOR')
  const [recommendedResolution, setRecommendedResolution] = useState('')
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (assessmentQuery.isError) {
      showToast(
        getApiErrorMessage(
          assessmentQuery.error,
          'Không tải được đánh giá kỹ thuật.',
        ),
        'error',
      )
    }
  }, [assessmentQuery.isError, assessmentQuery.error, showToast])

  if (assessmentQuery.isLoading) return <DashboardPageSkeleton />

  const detail = assessmentQuery.data
  const assessment = detail?.technical_assessment

  if (!detail || !assessment) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Không có đánh giá kỹ thuật
        </h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Hồ sơ chưa được phân công cho bạn hoặc đánh giá kỹ thuật chưa được
          tạo.
        </p>
        <Link to="/dashboard" className="mt-4">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Quay lại Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  const status = assessment.status
  const statusLabel = ASSESSMENT_STATUS_LABELS[status] ?? status
  const isMutating =
    isUploading || startMutation.isPending || submitMutation.isPending

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync()
      showToast('Đã bắt đầu đánh giá kỹ thuật.', 'success')
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể bắt đầu đánh giá.'),
        'error',
      )
    }
  }

  const handleSubmit = async () => {
    if (findings.trim().length < 10) {
      showToast('Kết luận đánh giá phải có ít nhất 10 ký tự.', 'error')
      return
    }
    if (rootCause.trim().length < 5) {
      showToast('Nguyên nhân gốc phải có ít nhất 5 ký tự.', 'error')
      return
    }
    if (recommendedResolution.trim().length < 5) {
      showToast('Hướng xử lý đề xuất phải có ít nhất 5 ký tự.', 'error')
      return
    }

    setIsUploading(true)
    try {
      const uploads = await Promise.all(
        evidenceFiles.map((file) =>
          uploadFileApi(file, {
            purpose: 'CUSTOMER_CASE_EVIDENCE',
            related_type: 'CUSTOMER_CASE',
            related_id: caseId,
          }),
        ),
      )
      await submitMutation.mutateAsync({
        findings: findings.trim(),
        root_cause: rootCause.trim(),
        severity,
        recommended_resolution: recommendedResolution.trim(),
        upload_ids: uploads.map((upload) => upload.id),
      })
      showToast('Đã nộp kết quả đánh giá kỹ thuật.', 'success')
      setEvidenceFiles([])
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể nộp đánh giá kỹ thuật.'),
        'error',
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Dashboard
        </Link>
      </div>

      <PageHeader
        eyebrow="Carivo Staff"
        title="Đánh giá kỹ thuật"
        description={`Đánh giá kỹ thuật của hồ sơ ${detail.case.case_code ?? detail.case.id}.`}
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
            <Row
              label="Mã inspector"
              value={
                assessment.inspector_staff_profile_id ??
                assessment.inspector_user_id ??
                'Chưa xác định'
              }
            />
            <Row
              label="Bắt đầu"
              value={
                assessment.started_at
                  ? formatDateTime(assessment.started_at)
                  : '—'
              }
            />
            <Row
              label="Nộp kết quả"
              value={
                assessment.submitted_at
                  ? formatDateTime(assessment.submitted_at)
                  : '—'
              }
            />
            {assessment.findings ? (
              <AssessmentText label="Kết luận" value={assessment.findings} />
            ) : null}
            {assessment.root_cause ? (
              <AssessmentText
                label="Nguyên nhân gốc"
                value={assessment.root_cause}
              />
            ) : null}
            {assessment.severity ? (
              <Row
                label="Mức độ"
                value={SEVERITY_LABELS[assessment.severity]}
              />
            ) : null}
            {assessment.recommended_resolution ? (
              <AssessmentText
                label="Hướng xử lý"
                value={assessment.recommended_resolution}
              />
            ) : null}
            {assessment.evidence?.length ? (
              <div className="grid grid-cols-2 gap-2 pt-2">
                {assessment.evidence.map((evidence) => (
                  <a
                    key={evidence.id}
                    href={evidence.url}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-lg border border-slate-200"
                  >
                    <img
                      src={evidence.url}
                      alt="Bằng chứng đánh giá kỹ thuật"
                      className="h-24 w-full object-cover"
                    />
                  </a>
                ))}
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
            {status === 'ASSIGNED' ? (
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-700">
                  Bắt đầu kiểm tra thực tế và ghi nhận đánh giá
                </p>
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
              <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-700">
                  Nộp kết quả đánh giá
                </p>
                <div>
                  <Label htmlFor="findings" required>
                    Kết luận đánh giá
                  </Label>
                  <textarea
                    id="findings"
                    rows={4}
                    maxLength={5000}
                    className="min-h-[100px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    placeholder="Mô tả kết quả kiểm tra kỹ thuật..."
                    value={findings}
                    onChange={(event) => setFindings(event.target.value)}
                    disabled={isMutating}
                  />
                </div>
                <div>
                  <Label htmlFor="root-cause" required>
                    Nguyên nhân gốc
                  </Label>
                  <textarea
                    id="root-cause"
                    rows={3}
                    maxLength={3000}
                    className="min-h-[80px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    placeholder="Xác định nguyên nhân dẫn đến sự cố..."
                    value={rootCause}
                    onChange={(event) => setRootCause(event.target.value)}
                    disabled={isMutating}
                  />
                </div>
                <div>
                  <Label htmlFor="severity" required>
                    Mức độ
                  </Label>
                  <Select
                    id="severity"
                    value={severity}
                    onChange={(event) =>
                      setSeverity(
                        event.target
                          .value as ApiSubmitTechnicalAssessmentPayload['severity'],
                      )
                    }
                    disabled={isMutating}
                  >
                    {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="recommended-resolution" required>
                    Hướng xử lý đề xuất
                  </Label>
                  <textarea
                    id="recommended-resolution"
                    rows={3}
                    maxLength={3000}
                    className="min-h-[80px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    placeholder="Đề xuất phương án xử lý tiếp theo..."
                    value={recommendedResolution}
                    onChange={(event) =>
                      setRecommendedResolution(event.target.value)
                    }
                    disabled={isMutating}
                  />
                </div>
                <div>
                  <Label htmlFor="technical-evidence">Ảnh bằng chứng</Label>
                  <Input
                    id="technical-evidence"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      setEvidenceFiles(
                        Array.from(event.target.files ?? []).slice(0, 10),
                      )
                    }
                    disabled={isMutating}
                  />
                  {evidenceFiles.length > 0 ? (
                    <p className="mt-1 text-xs font-medium text-slate-700">
                      Đã chọn {evidenceFiles.length} ảnh.
                    </p>
                  ) : null}
                </div>
                <Button onClick={handleSubmit} disabled={isMutating}>
                  {isMutating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isUploading ? 'Đang tải ảnh...' : 'Nộp kết quả'}
                </Button>
              </div>
            ) : null}

            {status === 'SUBMITTED' ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Đánh giá đã được nộp và lưu vào hồ sơ khiếu nại.
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
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  )
}

function AssessmentText({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="mb-1 font-medium text-slate-700">{label}</p>
      <p className="whitespace-pre-wrap text-slate-700">{value}</p>
    </div>
  )
}
