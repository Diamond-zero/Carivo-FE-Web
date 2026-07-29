import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Upload,
} from 'lucide-react'
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
import { EmptyState } from '../../../components/ui/EmptyState'
import { Label } from '../../../components/ui/Label'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'
import {
  CASE_CATEGORY_LABELS,
  CASE_PRIORITY_LABELS,
  CASE_PRIORITY_VARIANT,
  CASE_STATUS_LABELS,
  CASE_STATUS_VARIANT,
  useAcknowledgeCustomerCaseMutation,
  useAddCustomerCaseEvidenceMutation,
  useAssignCustomerCaseMutation,
  useAssignTechnicalAssessmentMutation,
  useSendCustomerCaseMessageMutation,
  useStaffCustomerCaseDetail,
} from '../../../hooks/api/staff/useStaffCustomerCases'
import { useMyCapabilities } from '../../../hooks/api/staff/useStaffCapabilities'
import type {
  ApiCustomerCase,
  ApiCustomerCaseMessage,
  ApiCustomerCaseTimelineEvent,
} from '../../../types/api/customerCase'
import { formatDateTime } from '../../../utils/format'

const EVENT_LABELS: Record<string, string> = {
  SUBMITTED: 'Khách gửi hồ sơ',
  EVIDENCE_ADDED: 'Đã thêm bằng chứng',
  ASSIGNED: 'Đã phân công xử lý',
  ACKNOWLEDGED: 'Đã tiếp nhận',
  MESSAGE_SENT: 'Đã gửi tin nhắn',
  CONCLUDED: 'Đã kết luận',
  CLOSED: 'Đã đóng hồ sơ',
  TECHNICAL_ASSESSMENT_ASSIGNED: 'Đã phân công đánh giá kỹ thuật',
  TECHNICAL_ASSESSMENT_STARTED: 'Đã bắt đầu đánh giá kỹ thuật',
  TECHNICAL_ASSESSMENT_SUBMITTED: 'Đã nộp đánh giá kỹ thuật',
  RESOLUTION_PROPOSED: 'Đã đề xuất phương án giải quyết',
  RESOLUTION_ACCEPTED: 'Khách đã chấp nhận phương án',
  RESOLUTION_REJECTED: 'Khách đã từ chối phương án',
  RESOLUTION_APPLIED: 'Đã áp dụng phương án',
  SLA_ESCALATED: 'Hồ sơ bị nâng mức SLA',
  REOPENED: 'Đã mở lại hồ sơ',
}

export function StaffCustomerCaseDetailPage() {
  const { caseId } = useParams()
  const { session } = useAuth()
  const { showToast } = useToast()
  const capabilities = useMyCapabilities()

  const detailQuery = useStaffCustomerCaseDetail(caseId)
  const acknowledgeMutation = useAcknowledgeCustomerCaseMutation(caseId ?? '')
  const assignMutation = useAssignCustomerCaseMutation(caseId ?? '')
  const evidenceMutation = useAddCustomerCaseEvidenceMutation(caseId ?? '')
  const messageMutation = useSendCustomerCaseMessageMutation(caseId ?? '')
  const technicalAssignMutation = useAssignTechnicalAssessmentMutation(
    caseId ?? '',
  )

  const [assignStaffProfileId, setAssignStaffProfileId] = useState('')
  const [technicalInspectorProfileId, setTechnicalInspectorProfileId] =
    useState('')
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [evidenceInputKey, setEvidenceInputKey] = useState(0)
  const [messageBody, setMessageBody] = useState('')
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false)

  useEffect(() => {
    if (detailQuery.isError) {
      showToast(
        getApiErrorMessage(detailQuery.error, 'Không tải được hồ sơ.'),
        'error',
      )
    }
  }, [detailQuery.isError, detailQuery.error, showToast])

  if (detailQuery.isLoading) return <DashboardPageSkeleton />

  if (!detailQuery.data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Không tìm thấy hồ sơ
        </h1>
        <Link to="/staff/cases" className="mt-4">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </Link>
      </div>
    )
  }

  const detail = detailQuery.data
  const c = detail.case
  const statusLabel = CASE_STATUS_LABELS[c.status] ?? c.status
  const priorityLabel = CASE_PRIORITY_LABELS[c.priority] ?? c.priority
  const canAcknowledge =
    c.status === 'SUBMITTED' &&
    capabilities.includes('customer_case.acknowledge')
  const isOpenCase = ['SUBMITTED', 'ACKNOWLEDGED', 'INVESTIGATING'].includes(
    c.status,
  )
  const canAssign =
    isOpenCase && capabilities.includes('customer_case.assign_garage')
  const canCommunicate =
    capabilities.includes('customer_case.communicate_assigned') &&
    c.assigned_to_id === session?.user.id
  const canAddEvidence = isOpenCase && canCommunicate
  const canOpenTechnicalAssessment =
    capabilities.includes('customer_case.technical_assess_assigned') &&
    detail.technical_assessment?.inspector_user_id === session?.user.id
  const isMutating =
    acknowledgeMutation.isPending ||
    assignMutation.isPending ||
    evidenceMutation.isPending ||
    messageMutation.isPending ||
    technicalAssignMutation.isPending ||
    isUploadingEvidence

  const handleAcknowledge = async () => {
    try {
      await acknowledgeMutation.mutateAsync({})
      showToast('Đã tiếp nhận và nhận xử lý hồ sơ.', 'success')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể tiếp nhận.'), 'error')
    }
  }

  const handleAssign = async () => {
    const staffProfileId = assignStaffProfileId.trim()
    if (!staffProfileId) {
      showToast('Vui lòng nhập ID hồ sơ nhân viên xử lý.', 'error')
      return
    }
    try {
      await assignMutation.mutateAsync({ staff_profile_id: staffProfileId })
      showToast('Đã phân công nhân viên xử lý.', 'success')
      setAssignStaffProfileId('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể phân công.'), 'error')
    }
  }

  const handleAssignTechnicalAssessment = async () => {
    const staffProfileId = technicalInspectorProfileId.trim()
    if (!staffProfileId) {
      showToast('Vui lòng nhập ID hồ sơ nhân viên kiểm tra xe.', 'error')
      return
    }
    try {
      await technicalAssignMutation.mutateAsync({
        staff_profile_id: staffProfileId,
      })
      showToast('Đã phân công đánh giá kỹ thuật.', 'success')
      setTechnicalInspectorProfileId('')
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể phân công đánh giá kỹ thuật.'),
        'error',
      )
    }
  }

  const handleAddEvidence = async () => {
    if (!caseId || evidenceFiles.length === 0) {
      showToast('Vui lòng chọn ít nhất một hình ảnh.', 'error')
      return
    }

    setIsUploadingEvidence(true)
    try {
      const uploadIds: string[] = []
      for (const file of evidenceFiles) {
        const upload = await uploadFileApi(file, {
          purpose: 'CUSTOMER_CASE_EVIDENCE',
          related_type: 'CUSTOMER_CASE',
          related_id: caseId,
        })
        uploadIds.push(upload.id)
      }
      await evidenceMutation.mutateAsync({ upload_ids: uploadIds })
      showToast(`Đã thêm ${uploadIds.length} hình ảnh bằng chứng.`, 'success')
      setEvidenceFiles([])
      setEvidenceInputKey((value) => value + 1)
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể thêm bằng chứng.'),
        'error',
      )
    } finally {
      setIsUploadingEvidence(false)
    }
  }

  const handleSendMessage = async () => {
    const message = messageBody.trim()
    if (!message) {
      showToast('Vui lòng nhập nội dung tin nhắn.', 'error')
      return
    }
    try {
      await messageMutation.mutateAsync({ message })
      showToast('Đã gửi tin nhắn cho khách.', 'success')
      setMessageBody('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể gửi tin nhắn.'), 'error')
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/staff/cases"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
      </div>

      <PageHeader
        eyebrow="Carivo Staff"
        title={CASE_CATEGORY_LABELS[c.category] ?? c.category}
        description={`Mã hồ sơ: ${c.case_code ?? c.id}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Badge variant={CASE_STATUS_VARIANT[c.status] ?? 'default'}>
              {statusLabel}
            </Badge>
            <Badge variant={CASE_PRIORITY_VARIANT[c.priority] ?? 'default'}>
              {priorityLabel}
            </Badge>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin chung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row
              label="Khách hàng"
              value={c.customer?.full_name ?? c.reporter_name ?? '—'}
            />
            <Row
              label="Số điện thoại"
              value={c.reporter_phone ?? c.customer?.phone ?? '—'}
            />
            <Row
              label="Phân loại"
              value={CASE_CATEGORY_LABELS[c.category] ?? c.category}
            />
            <Row label="Booking liên quan" value={c.booking_id ?? '—'} />
            <Row
              label="Nhân viên xử lý"
              value={
                c.assigned_to?.full_name ?? c.assigned_to_id ?? 'Chưa phân công'
              }
            />
            <Row
              label="Mở lúc"
              value={c.created_at ? formatDateTime(c.created_at) : '—'}
            />
            <Row
              label="Hạn phản hồi đầu"
              value={
                c.first_response_due_at
                  ? formatDateTime(c.first_response_due_at)
                  : '—'
              }
            />
            <Row
              label="Hạn giải quyết"
              value={
                c.resolution_due_at ? formatDateTime(c.resolution_due_at) : '—'
              }
            />
            <div className="rounded-xl bg-slate-50 p-3 text-slate-700">
              {c.description}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <CaseTimeline events={detail.timeline} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bằng chứng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CaseEvidence items={c.evidence ?? []} />
            {canAddEvidence ? (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div>
                  <Label htmlFor="case-evidence-files">Hình ảnh mới</Label>
                  <input
                    key={evidenceInputKey}
                    id="case-evidence-files"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-medium file:text-brand-700"
                    onChange={(event) =>
                      setEvidenceFiles(
                        Array.from(event.target.files ?? []).slice(0, 10),
                      )
                    }
                  />
                  {evidenceFiles.length > 0 ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Đã chọn {evidenceFiles.length} ảnh.
                    </p>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  onClick={handleAddEvidence}
                  disabled={isMutating}
                >
                  {isUploadingEvidence || evidenceMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Tải bằng chứng lên
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tin nhắn với khách</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CaseMessages items={detail.messages} />
            {canCommunicate ? (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div>
                  <Label htmlFor="case-message">Nội dung</Label>
                  <textarea
                    id="case-message"
                    rows={3}
                    className="min-h-[80px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                    placeholder="Nhập nội dung trao đổi với khách…"
                    value={messageBody}
                    onChange={(event) => setMessageBody(event.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={isMutating}
                >
                  {messageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4" />
                  )}
                  Gửi tin nhắn
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {canAcknowledge || canAssign || canOpenTechnicalAssessment ? (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Hành động</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canAcknowledge ? (
                <Button onClick={handleAcknowledge} disabled={isMutating}>
                  <ShieldCheck className="h-4 w-4" />
                  Tiếp nhận và nhận xử lý
                </Button>
              ) : null}

              {canAssign ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[240px] flex-1">
                      <Label htmlFor="assign-case-staff">
                        ID hồ sơ nhân viên chăm sóc khách hàng
                      </Label>
                      <input
                        id="assign-case-staff"
                        className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                        placeholder="ObjectId staff profile"
                        value={assignStaffProfileId}
                        onChange={(event) =>
                          setAssignStaffProfileId(event.target.value)
                        }
                      />
                    </div>
                    <Button onClick={handleAssign} disabled={isMutating}>
                      Phân công xử lý
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[240px] flex-1">
                      <Label htmlFor="assign-case-inspector">
                        ID hồ sơ nhân viên kiểm tra xe
                      </Label>
                      <input
                        id="assign-case-inspector"
                        className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                        placeholder="ObjectId staff profile"
                        value={technicalInspectorProfileId}
                        onChange={(event) =>
                          setTechnicalInspectorProfileId(event.target.value)
                        }
                      />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={handleAssignTechnicalAssessment}
                      disabled={isMutating}
                    >
                      Phân công đánh giá
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {canOpenTechnicalAssessment ? (
                  <Link to={`/staff/cases/${c.id}/technical-assessment`}>
                    <Button variant="secondary" size="sm">
                      <ClipboardList className="h-4 w-4" />
                      Mở đánh giá kỹ thuật
                    </Button>
                  </Link>
                ) : null}
                {c.booking_id ? (
                  <Link to={`/bookings/${c.booking_id}`}>
                    <Button variant="secondary" size="sm">
                      Mở booking liên quan
                    </Button>
                  </Link>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}
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

function CaseTimeline({ events }: { events: ApiCustomerCaseTimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Chưa có sự kiện nào"
        description="Timeline sẽ cập nhật khi có hành động trên hồ sơ."
      />
    )
  }

  return (
    <ul className="space-y-3">
      {events.map((event) => (
        <li
          key={event.id}
          className="flex flex-wrap items-start gap-3 border-l-2 border-brand-200 pl-4"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-900">
              {EVENT_LABELS[event.event_type] ?? event.event_type}
            </p>
            {event.from_status && event.to_status ? (
              <p className="text-sm text-slate-600">
                {CASE_STATUS_LABELS[event.from_status] ?? event.from_status} →{' '}
                {CASE_STATUS_LABELS[event.to_status] ?? event.to_status}
              </p>
            ) : null}
            {event.actor?.full_name ? (
              <p className="text-xs text-slate-500">
                bởi {event.actor.full_name}
              </p>
            ) : null}
          </div>
          <span className="text-xs text-slate-500">
            {event.created_at ? formatDateTime(event.created_at) : ''}
          </span>
        </li>
      ))}
    </ul>
  )
}

function CaseEvidence({
  items,
}: {
  items: NonNullable<ApiCustomerCase['evidence']>
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có bằng chứng.</p>
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((evidence) =>
        evidence.url ? (
          <a
            key={evidence.id}
            href={evidence.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl border border-slate-200 p-3 text-sm hover:bg-slate-50"
          >
            <div className="font-medium text-slate-900">
              {evidence.mime_type ?? 'Hình ảnh'}
            </div>
            <div className="truncate text-slate-500">{evidence.url}</div>
          </a>
        ) : (
          <div
            key={evidence.id}
            className="rounded-xl border border-slate-200 p-3 text-sm text-slate-500"
          >
            {evidence.id}
          </div>
        ),
      )}
    </div>
  )
}

function CaseMessages({ items }: { items: ApiCustomerCaseMessage[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có tin nhắn nào.</p>
  }

  return (
    <ul className="space-y-3">
      {items.map((message) => (
        <li
          key={message.id}
          className="rounded-xl border border-slate-200 bg-white p-3 text-sm"
        >
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-slate-900">
              {message.sender?.full_name ?? message.sender_role}
            </span>
            <span className="text-xs text-slate-500">
              {message.created_at ? formatDateTime(message.created_at) : ''}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-slate-700">
            {message.message}
          </p>
        </li>
      ))}
    </ul>
  )
}
