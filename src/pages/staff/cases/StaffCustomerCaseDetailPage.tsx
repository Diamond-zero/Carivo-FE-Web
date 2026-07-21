import { ArrowLeft, Loader2, MessageCircle, ShieldCheck } from 'lucide-react'
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
import { EmptyState } from '../../components/ui/EmptyState'
import { Label } from '../../components/ui/Label'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../contexts/ToastContext'
import {
  CASE_PRIORITY_LABELS,
  CASE_PRIORITY_VARIANT,
  CASE_STATUS_LABELS,
  CASE_STATUS_VARIANT,
  useAcknowledgeCustomerCaseMutation,
  useAddCustomerCaseEvidenceMutation,
  useAssignCustomerCaseMutation,
  useSendCustomerCaseMessageMutation,
  useStaffCustomerCaseDetail,
} from '../../hooks/api/staff/useStaffCustomerCases'
import type {
  ApiCustomerCase,
  ApiCustomerCaseMessage,
  ApiCustomerCaseTimelineEvent,
} from '../../types/api/customerCase'
import { formatDateTime } from '../../utils/format'

export function StaffCustomerCaseDetailPage() {
  const { caseId } = useParams()
  const { showToast } = useToast()

  const detailQuery = useStaffCustomerCaseDetail(caseId)
  const acknowledgeMutation = useAcknowledgeCustomerCaseMutation(caseId ?? '')
  const assignMutation = useAssignCustomerCaseMutation(caseId ?? '')
  const evidenceMutation = useAddCustomerCaseEvidenceMutation(caseId ?? '')
  const messageMutation = useSendCustomerCaseMessageMutation(caseId ?? '')

  const [assignStaffId, setAssignStaffId] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [evidenceType, setEvidenceType] = useState<'IMAGE' | 'VIDEO' | 'DOCUMENT'>('IMAGE')
  const [messageBody, setMessageBody] = useState('')
  const [messageVisibility, setMessageVisibility] = useState<'CUSTOMER_VISIBLE' | 'INTERNAL'>(
    'CUSTOMER_VISIBLE',
  )

  useEffect(() => {
    if (detailQuery.isError) {
      showToast(getApiErrorMessage(detailQuery.error, 'Không tải được hồ sơ.'), 'error')
    }
  }, [detailQuery.isError, detailQuery.error, showToast])

  if (detailQuery.isLoading) return <DashboardPageSkeleton />
  if (!detailQuery.data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold text-slate-900">Không tìm thấy hồ sơ</h1>
        <Link to="/staff/cases" className="mt-4">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </Link>
      </div>
    )
  }

  const c = detailQuery.data
  const statusLabel = CASE_STATUS_LABELS[c.status] ?? c.status
  const priorityLabel = CASE_PRIORITY_LABELS[c.priority] ?? c.priority

  const handleAcknowledge = async (selfAssign: boolean) => {
    try {
      await acknowledgeMutation.mutateAsync({ self_assign: selfAssign })
      showToast('Đã tiếp nhận hồ sơ.', 'success')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể tiếp nhận.'), 'error')
    }
  }

  const handleAssign = async () => {
    if (!assignStaffId.trim()) {
      showToast('Vui lòng nhập ID nhân viên xử lý.', 'error')
      return
    }
    try {
      await assignMutation.mutateAsync({
        assigned_staff_id: assignStaffId.trim(),
      })
      showToast('Đã phân công nhân viên xử lý.', 'success')
      setAssignStaffId('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể phân công.'), 'error')
    }
  }

  const handleAddEvidence = async () => {
    if (!evidenceUrl.trim()) {
      showToast('Vui lòng nhập URL ảnh/tài liệu.', 'error')
      return
    }
    try {
      await evidenceMutation.mutateAsync({
        type: evidenceType,
        url: evidenceUrl.trim(),
      })
      showToast('Đã thêm bằng chứng.', 'success')
      setEvidenceUrl('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể thêm bằng chứng.'), 'error')
    }
  }

  const handleSendMessage = async () => {
    if (!messageBody.trim()) {
      showToast('Vui lòng nhập nội dung tin nhắn.', 'error')
      return
    }
    try {
      await messageMutation.mutateAsync({
        body: messageBody.trim(),
        visibility: messageVisibility,
      })
      showToast('Đã gửi tin nhắn.', 'success')
      setMessageBody('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể gửi tin nhắn.'), 'error')
    }
  }

  const isMutating =
    acknowledgeMutation.isPending ||
    assignMutation.isPending ||
    evidenceMutation.isPending ||
    messageMutation.isPending

  const canAcknowledge = c.status === 'OPEN'

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
        title={c.subject}
        description={`Mã hồ sơ: ${c.case_code ?? c.id.replace('case-', '#')}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Badge variant={CASE_STATUS_VARIANT[c.status] ?? 'default'}>{statusLabel}</Badge>
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
            <Row label="Khách hàng" value={c.customer?.full_name ?? '—'} />
            <Row label="Số điện thoại" value={c.customer?.phone ?? '—'} />
            <Row label="Phân loại" value={c.category} />
            <Row label="Booking liên quan" value={c.booking_id ?? '—'} />
            <Row label="Nhân viên xử lý" value={c.assigned_staff_name ?? c.assigned_staff_id ?? 'Chưa phân công'} />
            <Row label="Mở lúc" value={c.opened_at ? formatDateTime(c.opened_at) : '—'} />
            <Row label="SLA đến hạn" value={c.sla_due_at ? formatDateTime(c.sla_due_at) : '—'} />
            {c.description ? (
              <div className="rounded-xl bg-slate-50 p-3 text-slate-700">
                {c.description}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <CaseTimeline events={c.timeline ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bằng chứng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CaseEvidence items={c.evidence ?? []} />
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div>
                <Label htmlFor="evidence-type">Loại</Label>
                <Select
                  id="evidence-type"
                  value={evidenceType}
                  onChange={(event) =>
                    setEvidenceType(event.target.value as 'IMAGE' | 'VIDEO' | 'DOCUMENT')
                  }
                >
                  <option value="IMAGE">Hình ảnh</option>
                  <option value="VIDEO">Video</option>
                  <option value="DOCUMENT">Tài liệu</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="evidence-url">URL bằng chứng</Label>
                <input
                  id="evidence-url"
                  className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                  placeholder="https://…"
                  value={evidenceUrl}
                  onChange={(event) => setEvidenceUrl(event.target.value)}
                />
              </div>
              <Button size="sm" onClick={handleAddEvidence} disabled={isMutating}>
                {evidenceMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Thêm bằng chứng
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tin nhắn với khách</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CaseMessages items={c.messages ?? []} />
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div>
                <Label htmlFor="msg-visibility">Phạm vi hiển thị</Label>
                <Select
                  id="msg-visibility"
                  value={messageVisibility}
                  onChange={(event) =>
                    setMessageVisibility(
                      event.target.value as 'CUSTOMER_VISIBLE' | 'INTERNAL',
                    )
                  }
                >
                  <option value="CUSTOMER_VISIBLE">Khách hàng thấy</option>
                  <option value="INTERNAL">Nội bộ</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="msg-body">Nội dung</Label>
                <textarea
                  id="msg-body"
                  rows={3}
                  className="min-h-[80px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                  placeholder="Nhập nội dung tin nhắn…"
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                />
              </div>
              <Button size="sm" onClick={handleSendMessage} disabled={isMutating}>
                {messageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                Gửi tin nhắn
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Hành động</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {canAcknowledge ? (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleAcknowledge(false)} disabled={isMutating}>
                  <ShieldCheck className="h-4 w-4" />
                  Tiếp nhận
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleAcknowledge(true)}
                  disabled={isMutating}
                >
                  Tiếp nhận & nhận xử lý
                </Button>
              </div>
            ) : null}
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="assign-staff">Phân công nhân viên</Label>
                <input
                  id="assign-staff"
                  className="h-11 w-full rounded-xl border border-slate-200/90 bg-white px-4 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
                  placeholder="ID nhân viên"
                  value={assignStaffId}
                  onChange={(event) => setAssignStaffId(event.target.value)}
                />
              </div>
              <Button onClick={handleAssign} disabled={isMutating}>
                Phân công
              </Button>
            </div>
            {c.booking_id ? (
              <Link to={`/bookings/${c.booking_id}`}>
                <Button variant="secondary" size="sm">
                  Mở booking liên quan
                </Button>
              </Link>
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
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900">{event.type}</p>
            {event.description ? (
              <p className="text-sm text-slate-600">{event.description}</p>
            ) : null}
            {event.actor_name ? (
              <p className="text-xs text-slate-500">bởi {event.actor_name}</p>
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
      {items.map((evidence) => (
        <a
          key={evidence.id}
          href={evidence.url}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl border border-slate-200 p-3 text-sm hover:bg-slate-50"
        >
          <div className="font-medium text-slate-900">{evidence.type}</div>
          <div className="truncate text-slate-500">{evidence.url}</div>
          {evidence.caption ? (
            <div className="mt-1 text-xs text-slate-500">{evidence.caption}</div>
          ) : null}
        </a>
      ))}
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
              {message.sender_name ?? message.sender_type}
            </span>
            <div className="flex items-center gap-2">
              {message.visibility === 'INTERNAL' ? (
                <Badge variant="warning">Nội bộ</Badge>
              ) : (
                <Badge variant="info">Khách thấy</Badge>
              )}
              <span className="text-xs text-slate-500">
                {message.created_at ? formatDateTime(message.created_at) : ''}
              </span>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-slate-700">{message.body}</p>
        </li>
      ))}
    </ul>
  )
}