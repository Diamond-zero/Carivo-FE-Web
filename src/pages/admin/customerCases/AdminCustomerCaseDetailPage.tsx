import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCcw,
  Send,
  Upload,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { Textarea } from '../../../components/ui/Textarea'
import {
  CASE_CATEGORY_LABELS,
  CASE_PRIORITY_LABELS,
  CASE_PRIORITY_VARIANT,
  CASE_STATUS_LABELS,
  CASE_STATUS_VARIANT,
  TECHNICAL_CASE_CATEGORIES,
} from '../../../constants/customerCase'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAcknowledgeAdminCustomerCaseMutation,
  useAddAdminCustomerCaseEvidenceMutation,
  useAdminCustomerCaseDetail,
  useApplyAdminCustomerCaseResolutionMutation,
  useAssignAdminCustomerCaseMutation,
  useAssignAdminTechnicalAssessmentMutation,
  useCloseAdminCustomerCaseMutation,
  useConcludeAdminCustomerCaseMutation,
  useProposeAdminCustomerCaseResolutionMutation,
  useReopenAdminCustomerCaseMutation,
  useSendAdminCustomerCaseMessageMutation,
  useUpdateAdminCustomerCaseRefundMutation,
} from '../../../hooks/api/admin/useAdminCustomerCases'
import { useAdminGarages } from '../../../hooks/api/admin/useAdminGarages'
import { useAdminServicePackages } from '../../../hooks/api/admin/useAdminServicePackages'
import { useAdminStaff } from '../../../hooks/api/admin/useAdminStaff'
import type {
  ApiCustomerCaseEvidence,
  ApiCustomerCaseMessage,
  ApiCustomerCaseRefund,
  ApiCustomerCaseResolution,
  ApiCustomerCaseResolutionAction,
  ApiCustomerCaseTimelineEvent,
  CustomerCaseLiabilityStatus,
  CustomerCaseRefundMethod,
  CustomerCaseRefundStatus,
  CustomerCaseResolutionActionType,
  CustomerCaseVoucherType,
} from '../../../types/api/customerCase'
import { formatDateTime, formatPrice } from '../../../utils/format'

type ModalName =
  | 'RESOLUTION'
  | 'APPLY'
  | 'CONCLUDE'
  | 'CLOSE'
  | 'REFUND'
  | 'REOPEN'
  | null

interface ResolutionActionDraft {
  key: string
  action_type: CustomerCaseResolutionActionType
  amount: string
  refund_method: CustomerCaseRefundMethod
  voucher_type: CustomerCaseVoucherType
  value: string
  max_discount_amount: string
  min_order_amount: string
  service_package_id: string
  expires_at: string
  rework_start_time: string
  note: string
}

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
  RESOLUTION_PROPOSED: 'Đã đề xuất phương án',
  RESOLUTION_ACCEPTED: 'Khách đã chấp nhận phương án',
  RESOLUTION_REJECTED: 'Khách đã từ chối phương án',
  RESOLUTION_APPLIED: 'Đã áp dụng phương án',
  REFUND_STATUS_CHANGED: 'Đã cập nhật hoàn tiền',
  SLA_ESCALATED: 'Hồ sơ bị nâng mức SLA',
  REOPENED: 'Đã mở lại hồ sơ',
}

const RESOLUTION_STATUS_LABELS: Record<string, string> = {
  PROPOSED: 'Chờ khách phản hồi',
  CUSTOMER_ACCEPTED: 'Khách đã chấp nhận',
  CUSTOMER_REJECTED: 'Khách đã từ chối',
  APPLIED: 'Đã áp dụng',
  FAILED: 'Áp dụng thất bại',
  SUPERSEDED: 'Đã thay thế',
}

const ACTION_TYPE_LABELS: Record<CustomerCaseResolutionActionType, string> = {
  REFUND: 'Hoàn tiền',
  VOUCHER: 'Voucher bồi thường',
  REWORK: 'Thực hiện lại dịch vụ',
  WAIVE_CHARGE: 'Miễn giảm phí',
  NO_COMPENSATION: 'Không bồi thường',
}

const REFUND_STATUS_LABELS: Record<CustomerCaseRefundStatus, string> = {
  APPROVED: 'Đã phê duyệt',
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Hoàn tất',
  FAILED: 'Thất bại',
}

const REFUND_METHOD_LABELS: Record<CustomerCaseRefundMethod, string> = {
  ORIGINAL_PAYMENT: 'Phương thức thanh toán ban đầu',
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
}

const LIABILITY_OPTIONS: Array<{
  value: Exclude<CustomerCaseLiabilityStatus, 'UNDETERMINED'>
  label: string
}> = [
  { value: 'GARAGE_RESPONSIBLE', label: 'Garage chịu trách nhiệm' },
  { value: 'PRE_EXISTING_DAMAGE', label: 'Hư hỏng có từ trước' },
  {
    value: 'CUSTOMER_OR_THIRD_PARTY',
    label: 'Khách hàng hoặc bên thứ ba chịu trách nhiệm',
  },
  { value: 'INCONCLUSIVE', label: 'Không đủ cơ sở kết luận' },
]

const LIABILITY_LABELS: Record<CustomerCaseLiabilityStatus, string> = {
  UNDETERMINED: 'Chưa xác định',
  GARAGE_RESPONSIBLE: 'Garage chịu trách nhiệm',
  PRE_EXISTING_DAMAGE: 'Hư hỏng có từ trước',
  CUSTOMER_OR_THIRD_PARTY: 'Khách hàng hoặc bên thứ ba',
  INCONCLUSIVE: 'Không đủ cơ sở kết luận',
}

const TECHNICAL_STATUS_LABELS: Record<string, string> = {
  ASSIGNED: 'Đã phân công',
  IN_PROGRESS: 'Đang đánh giá',
  SUBMITTED: 'Đã nộp',
}

const SEVERITY_LABELS: Record<string, string> = {
  MINOR: 'Nhẹ',
  MODERATE: 'Trung bình',
  MAJOR: 'Nghiêm trọng',
  SAFETY_CRITICAL: 'Nguy hiểm an toàn',
}

function createActionDraft(
  actionType: CustomerCaseResolutionActionType = 'NO_COMPENSATION',
): ResolutionActionDraft {
  return {
    key: crypto.randomUUID(),
    action_type: actionType,
    amount: '',
    refund_method: 'ORIGINAL_PAYMENT',
    voucher_type: 'FIXED_AMOUNT',
    value: '',
    max_discount_amount: '',
    min_order_amount: '0',
    service_package_id: '',
    expires_at: '',
    rework_start_time: '',
    note: '',
  }
}

function optionalNumber(value: string) {
  const normalized = value.trim()
  return normalized ? Number(normalized) : undefined
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString()
}

function resolutionStatusVariant(status: string) {
  if (status === 'APPLIED') return 'success' as const
  if (status === 'CUSTOMER_ACCEPTED') return 'info' as const
  if (status === 'FAILED' || status === 'CUSTOMER_REJECTED') {
    return 'danger' as const
  }
  if (status === 'PROPOSED') return 'warning' as const
  return 'default' as const
}

function refundStatusVariant(status: CustomerCaseRefundStatus) {
  if (status === 'COMPLETED') return 'success' as const
  if (status === 'FAILED') return 'danger' as const
  if (status === 'PROCESSING') return 'info' as const
  return 'warning' as const
}

export function AdminCustomerCaseDetailPage() {
  const { caseId } = useParams()
  const { showToast } = useToast()
  const detailQuery = useAdminCustomerCaseDetail(caseId)
  const detail = detailQuery.data
  const customerCase = detail?.case
  const { allGarages: garages } = useAdminGarages()
  const { allStaff, isLoading: isLoadingStaff } = useAdminStaff()
  const { packages: servicePackages } = useAdminServicePackages({
    statusFilter: 'ACTIVE',
  })

  const assignMutation = useAssignAdminCustomerCaseMutation(caseId ?? '')
  const acknowledgeMutation =
    useAcknowledgeAdminCustomerCaseMutation(caseId ?? '')
  const technicalAssignMutation =
    useAssignAdminTechnicalAssessmentMutation(caseId ?? '')
  const evidenceMutation =
    useAddAdminCustomerCaseEvidenceMutation(caseId ?? '')
  const messageMutation =
    useSendAdminCustomerCaseMessageMutation(caseId ?? '')
  const proposeMutation =
    useProposeAdminCustomerCaseResolutionMutation(caseId ?? '')
  const applyMutation =
    useApplyAdminCustomerCaseResolutionMutation(caseId ?? '')
  const concludeMutation =
    useConcludeAdminCustomerCaseMutation(caseId ?? '')
  const closeMutation = useCloseAdminCustomerCaseMutation(caseId ?? '')
  const refundMutation =
    useUpdateAdminCustomerCaseRefundMutation(caseId ?? '')
  const reopenMutation = useReopenAdminCustomerCaseMutation(caseId ?? '')

  const [modal, setModal] = useState<ModalName>(null)
  const [selectedResolution, setSelectedResolution] =
    useState<ApiCustomerCaseResolution | null>(null)
  const [selectedRefund, setSelectedRefund] =
    useState<ApiCustomerCaseRefund | null>(null)
  const [assigneeProfileId, setAssigneeProfileId] = useState('')
  const [inspectorProfileId, setInspectorProfileId] = useState('')
  const [acknowledgeNote, setAcknowledgeNote] = useState('')
  const [message, setMessage] = useState('')
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [evidenceInputKey, setEvidenceInputKey] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [resolutionSummary, setResolutionSummary] = useState('')
  const [resolutionActions, setResolutionActions] = useState<
    ResolutionActionDraft[]
  >([createActionDraft()])
  const [liabilityStatus, setLiabilityStatus] = useState<
    Exclude<CustomerCaseLiabilityStatus, 'UNDETERMINED'>
  >('GARAGE_RESPONSIBLE')
  const [conclusion, setConclusion] = useState('')
  const [conclusionResolutionSummary, setConclusionResolutionSummary] =
    useState('')
  const [closeNote, setCloseNote] = useState('')
  const [reopenReason, setReopenReason] = useState('')
  const [refundStatus, setRefundStatus] =
    useState<Exclude<CustomerCaseRefundStatus, 'APPROVED'>>('PROCESSING')
  const [refundReference, setRefundReference] = useState('')
  const [refundNote, setRefundNote] = useState('')
  const [refundFailureReason, setRefundFailureReason] = useState('')

  const garageName =
    garages.find((garage) => garage.id === customerCase?.garage_id)?.name ??
    customerCase?.garage_id ??
    '—'
  const eligibleCustomerServiceStaff = useMemo(
    () =>
      allStaff.filter(
        (record) =>
          record.profile.garage_id === customerCase?.garage_id &&
          record.profile.staff_type === 'CUSTOMER_SERVICE_STAFF' &&
          record.profile.is_active &&
          record.user.is_active,
      ),
    [allStaff, customerCase?.garage_id],
  )
  const eligibleInspectors = useMemo(
    () =>
      allStaff.filter(
        (record) =>
          record.profile.garage_id === customerCase?.garage_id &&
          record.profile.staff_type === 'VEHICLE_INSPECTION_STAFF' &&
          record.profile.is_active &&
          record.user.is_active,
      ),
    [allStaff, customerCase?.garage_id],
  )

  useEffect(() => {
    if (!detailQuery.isError) return
    showToast(
      getApiErrorMessage(detailQuery.error, 'Không thể tải hồ sơ khiếu nại.'),
      'error',
    )
  }, [detailQuery.error, detailQuery.isError, showToast])

  if (detailQuery.isLoading) return <DashboardPageSkeleton />

  if (!detail || !customerCase) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Không tìm thấy hồ sơ"
        description="Hồ sơ không tồn tại hoặc không còn khả dụng."
        action={
          <Link to="/admin/customer-cases">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Quay lại danh sách
            </Button>
          </Link>
        }
      />
    )
  }

  const isOpen = ['SUBMITTED', 'ACKNOWLEDGED', 'INVESTIGATING'].includes(
    customerCase.status,
  )
  const isTechnicalCategory = TECHNICAL_CASE_CATEGORIES.includes(
    customerCase.category,
  )
  const assessmentSubmitted =
    detail.technical_assessment?.status === 'SUBMITTED'
  const hasAcceptedResolution = detail.resolutions.some(
    (resolution) => resolution.status === 'CUSTOMER_ACCEPTED',
  )
  const canProposeResolution =
    isOpen &&
    !hasAcceptedResolution &&
    (!isTechnicalCategory || assessmentSubmitted)
  const appliedResolutionAfterReopen = detail.resolutions.some(
    (resolution) =>
      resolution.status === 'APPLIED' &&
      (!customerCase.last_reopened_at ||
        new Date(resolution.proposed_at).getTime() >=
          new Date(customerCase.last_reopened_at).getTime()),
  )
  const canConclude =
    ['ACKNOWLEDGED', 'INVESTIGATING'].includes(customerCase.status) &&
    appliedResolutionAfterReopen
  const isMutating =
    assignMutation.isPending ||
    acknowledgeMutation.isPending ||
    technicalAssignMutation.isPending ||
    evidenceMutation.isPending ||
    messageMutation.isPending ||
    proposeMutation.isPending ||
    applyMutation.isPending ||
    concludeMutation.isPending ||
    closeMutation.isPending ||
    refundMutation.isPending ||
    reopenMutation.isPending ||
    isUploading

  const handleAssign = async () => {
    if (!assigneeProfileId) {
      showToast('Vui lòng chọn nhân viên xử lý.', 'error')
      return
    }
    try {
      await assignMutation.mutateAsync({
        staff_profile_id: assigneeProfileId,
      })
      showToast('Đã phân công nhân viên xử lý hồ sơ.', 'success')
      setAssigneeProfileId('')
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể phân công nhân viên.'),
        'error',
      )
    }
  }

  const handleAcknowledge = async () => {
    try {
      await acknowledgeMutation.mutateAsync({
        ...(acknowledgeNote.trim()
          ? { note: acknowledgeNote.trim() }
          : {}),
      })
      showToast('Đã tiếp nhận hồ sơ.', 'success')
      setAcknowledgeNote('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể tiếp nhận hồ sơ.'), 'error')
    }
  }

  const handleAssignTechnicalAssessment = async () => {
    if (!inspectorProfileId) {
      showToast('Vui lòng chọn nhân viên kiểm tra xe.', 'error')
      return
    }
    try {
      await technicalAssignMutation.mutateAsync({
        staff_profile_id: inspectorProfileId,
      })
      showToast('Đã phân công đánh giá kỹ thuật.', 'success')
      setInspectorProfileId('')
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể phân công đánh giá kỹ thuật.'),
        'error',
      )
    }
  }

  const handleSendMessage = async () => {
    const normalizedMessage = message.trim()
    if (!normalizedMessage) {
      showToast('Vui lòng nhập nội dung tin nhắn.', 'error')
      return
    }
    try {
      await messageMutation.mutateAsync({ message: normalizedMessage })
      showToast('Đã gửi tin nhắn cho khách hàng.', 'success')
      setMessage('')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể gửi tin nhắn.'), 'error')
    }
  }

  const handleUploadEvidence = async () => {
    if (!caseId || evidenceFiles.length === 0) {
      showToast('Vui lòng chọn ít nhất một hình ảnh.', 'error')
      return
    }
    setIsUploading(true)
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
      showToast(`Đã thêm ${uploadIds.length} bằng chứng.`, 'success')
      setEvidenceFiles([])
      setEvidenceInputKey((value) => value + 1)
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể tải bằng chứng lên.'),
        'error',
      )
    } finally {
      setIsUploading(false)
    }
  }

  const updateResolutionAction = (
    key: string,
    patch: Partial<ResolutionActionDraft>,
  ) => {
    setResolutionActions((current) =>
      current.map((action) =>
        action.key === key ? { ...action, ...patch } : action,
      ),
    )
  }

  const buildResolutionPayload = () => {
    if (resolutionSummary.trim().length < 10) {
      throw new Error('Tóm tắt phương án phải có ít nhất 10 ký tự.')
    }
    if (resolutionActions.length < 1 || resolutionActions.length > 3) {
      throw new Error('Phương án phải có từ 1 đến 3 hành động.')
    }
    const actionTypes = resolutionActions.map((action) => action.action_type)
    if (new Set(actionTypes).size !== actionTypes.length) {
      throw new Error('Mỗi loại hành động chỉ được chọn một lần.')
    }
    if (
      actionTypes.includes('NO_COMPENSATION') &&
      resolutionActions.length > 1
    ) {
      throw new Error('Không bồi thường không thể kết hợp hành động khác.')
    }
    if (
      actionTypes.includes('REFUND') &&
      actionTypes.includes('WAIVE_CHARGE')
    ) {
      throw new Error('Hoàn tiền không thể kết hợp miễn giảm phí.')
    }

    const actions: ApiCustomerCaseResolutionAction[] = resolutionActions.map(
      (action) => {
        const note = action.note.trim() || undefined
        if (action.action_type === 'REFUND') {
          const amount = optionalNumber(action.amount)
          if (!amount || amount <= 0) {
            throw new Error('Số tiền hoàn phải lớn hơn 0.')
          }
          return {
            action_type: action.action_type,
            amount,
            refund_method: action.refund_method,
            note,
          }
        }
        if (action.action_type === 'WAIVE_CHARGE') {
          const amount = optionalNumber(action.amount)
          if (!amount || amount <= 0) {
            throw new Error('Số tiền miễn giảm phải lớn hơn 0.')
          }
          return { action_type: action.action_type, amount, note }
        }
        if (action.action_type === 'REWORK') {
          if (!action.rework_start_time) {
            throw new Error('Vui lòng chọn thời gian thực hiện lại dịch vụ.')
          }
          return {
            action_type: action.action_type,
            rework_start_time: toIsoDateTime(action.rework_start_time),
            ...(action.service_package_id
              ? { service_package_id: action.service_package_id }
              : {}),
            note,
          }
        }
        if (action.action_type === 'VOUCHER') {
          if (customerCase.is_walk_in_case) {
            throw new Error('Khách walk-in không thể nhận voucher tài khoản.')
          }
          if (!action.expires_at) {
            throw new Error('Vui lòng chọn hạn sử dụng voucher.')
          }
          const value =
            action.voucher_type === 'FREE_SERVICE'
              ? 0
              : optionalNumber(action.value)
          if (
            action.voucher_type !== 'FREE_SERVICE' &&
            (!value || value <= 0)
          ) {
            throw new Error('Giá trị voucher phải lớn hơn 0.')
          }
          if (action.voucher_type === 'PERCENTAGE' && Number(value) > 100) {
            throw new Error('Voucher phần trăm không được vượt quá 100%.')
          }
          if (
            action.voucher_type === 'FREE_SERVICE' &&
            !action.service_package_id
          ) {
            throw new Error('Vui lòng chọn gói dịch vụ miễn phí.')
          }
          return {
            action_type: action.action_type,
            voucher_type: action.voucher_type,
            value,
            max_discount_amount: optionalNumber(
              action.max_discount_amount,
            ),
            min_order_amount: optionalNumber(action.min_order_amount) ?? 0,
            ...(action.service_package_id
              ? { service_package_id: action.service_package_id }
              : {}),
            expires_at: toIsoDateTime(action.expires_at),
            note,
          }
        }
        return { action_type: action.action_type, note }
      },
    )

    return { summary: resolutionSummary.trim(), actions }
  }

  const handleProposeResolution = async () => {
    try {
      const payload = buildResolutionPayload()
      await proposeMutation.mutateAsync(payload)
      showToast('Đã gửi phương án cho khách hàng xem xét.', 'success')
      setResolutionSummary('')
      setResolutionActions([createActionDraft()])
      setModal(null)
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể đề xuất phương án.'),
        'error',
      )
    }
  }

  const handleApplyResolution = async () => {
    if (!selectedResolution) return
    try {
      await applyMutation.mutateAsync(selectedResolution.id)
      showToast('Đã áp dụng phương án giải quyết.', 'success')
      setSelectedResolution(null)
      setModal(null)
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể áp dụng phương án.'),
        'error',
      )
    }
  }

  const handleConclude = async () => {
    if (conclusion.trim().length < 10) {
      showToast('Kết luận phải có ít nhất 10 ký tự.', 'error')
      return
    }
    try {
      await concludeMutation.mutateAsync({
        liability_status: liabilityStatus,
        conclusion: conclusion.trim(),
        ...(conclusionResolutionSummary.trim()
          ? { resolution_summary: conclusionResolutionSummary.trim() }
          : {}),
      })
      showToast('Đã kết luận hồ sơ.', 'success')
      setConclusion('')
      setConclusionResolutionSummary('')
      setModal(null)
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể kết luận hồ sơ.'), 'error')
    }
  }

  const handleClose = async () => {
    try {
      await closeMutation.mutateAsync({
        ...(closeNote.trim() ? { note: closeNote.trim() } : {}),
      })
      showToast('Đã đóng hồ sơ.', 'success')
      setCloseNote('')
      setModal(null)
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể đóng hồ sơ.'), 'error')
    }
  }

  const handleUpdateRefund = async () => {
    if (!selectedRefund) return
    if (refundStatus === 'COMPLETED' && !refundReference.trim()) {
      showToast('Hoàn tất hoàn tiền cần mã giao dịch.', 'error')
      return
    }
    if (refundStatus === 'FAILED' && !refundFailureReason.trim()) {
      showToast('Vui lòng nhập lý do hoàn tiền thất bại.', 'error')
      return
    }
    try {
      await refundMutation.mutateAsync({
        refundId: selectedRefund.id,
        payload: {
          status: refundStatus,
          ...(refundReference.trim()
            ? { transaction_reference: refundReference.trim() }
            : {}),
          ...(refundNote.trim() ? { note: refundNote.trim() } : {}),
          ...(refundFailureReason.trim()
            ? { failure_reason: refundFailureReason.trim() }
            : {}),
        },
      })
      showToast('Đã cập nhật trạng thái hoàn tiền.', 'success')
      setSelectedRefund(null)
      setRefundReference('')
      setRefundNote('')
      setRefundFailureReason('')
      setModal(null)
    } catch (error) {
      showToast(
        getApiErrorMessage(error, 'Không thể cập nhật hoàn tiền.'),
        'error',
      )
    }
  }

  const handleReopen = async () => {
    if (reopenReason.trim().length < 10) {
      showToast('Lý do mở lại phải có ít nhất 10 ký tự.', 'error')
      return
    }
    try {
      await reopenMutation.mutateAsync({ reason: reopenReason.trim() })
      showToast('Đã mở lại hồ sơ để tiếp tục xác minh.', 'success')
      setReopenReason('')
      setModal(null)
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể mở lại hồ sơ.'), 'error')
    }
  }

  return (
    <div>
      <Link
        to="/admin/customer-cases"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách
      </Link>

      <PageHeader
        eyebrow="Carivo Quản trị"
        title={CASE_CATEGORY_LABELS[customerCase.category]}
        description={`Mã hồ sơ: ${customerCase.case_code ?? customerCase.id}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Badge variant={CASE_STATUS_VARIANT[customerCase.status]}>
              {CASE_STATUS_LABELS[customerCase.status]}
            </Badge>
            <Badge variant={CASE_PRIORITY_VARIANT[customerCase.priority]}>
              {CASE_PRIORITY_LABELS[customerCase.priority]}
            </Badge>
          </div>
        }
      />

      <div className="mb-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin hồ sơ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label="Garage" value={garageName} />
            <InfoRow
              label="Khách hàng"
              value={
                customerCase.customer?.full_name ??
                customerCase.reporter_name ??
                '—'
              }
            />
            <InfoRow
              label="Số điện thoại"
              value={
                customerCase.customer?.phone ??
                customerCase.reporter_phone ??
                '—'
              }
            />
            <InfoRow
              label="Nguồn"
              value={
                customerCase.is_walk_in_case
                  ? 'Khách walk-in'
                  : customerCase.source === 'HANDOVER'
                    ? 'Tại bàn giao'
                    : 'Sau bàn giao'
              }
            />
            <InfoRow
              label="Nhân viên xử lý"
              value={
                customerCase.assigned_to?.full_name ?? 'Chưa phân công'
              }
            />
            <InfoRow
              label="Mở lúc"
              value={
                customerCase.created_at
                  ? formatDateTime(customerCase.created_at)
                  : '—'
              }
            />
            <InfoRow
              label="Hạn phản hồi"
              value={
                customerCase.first_response_due_at
                  ? formatDateTime(customerCase.first_response_due_at)
                  : '—'
              }
            />
            <InfoRow
              label="Hạn giải quyết"
              value={
                customerCase.resolution_due_at
                  ? formatDateTime(customerCase.resolution_due_at)
                  : '—'
              }
            />
            <InfoRow
              label="Số lần mở lại"
              value={String(customerCase.reopen_count ?? 0)}
            />
            {customerCase.booking_id ? (
              <Link
                to={`/admin/bookings/${customerCase.booking_id}`}
                className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:text-brand-800"
              >
                Mở booking liên quan
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Nội dung phản ánh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mô tả
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                {customerCase.description}
              </p>
            </div>
            {customerCase.damage_location ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Vị trí hư hỏng
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  {customerCase.damage_location}
                </p>
              </div>
            ) : null}
            {customerCase.desired_resolution ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mong muốn của khách
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                  {customerCase.desired_resolution}
                </p>
              </div>
            ) : null}
            {customerCase.last_reopen_reason ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Lý do mở lại gần nhất
                </p>
                <p className="mt-1 text-sm text-amber-900">
                  {customerCase.last_reopen_reason}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Điều phối và xử lý</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          {isOpen ? (
            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-brand-600" />
                <h3 className="font-semibold text-slate-900">
                  Nhân viên phụ trách
                </h3>
              </div>
              <div>
                <Label htmlFor="admin-case-assignee">
                  Customer Service cùng garage
                </Label>
                <Select
                  id="admin-case-assignee"
                  value={assigneeProfileId}
                  disabled={isLoadingStaff || isMutating}
                  onChange={(event) =>
                    setAssigneeProfileId(event.target.value)
                  }
                >
                  <option value="">Chọn nhân viên</option>
                  {eligibleCustomerServiceStaff.map((record) => (
                    <option
                      key={record.profile.id}
                      value={record.profile.id}
                    >
                      {record.user.full_name} · {record.profile.staff_code}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={isMutating || !assigneeProfileId}
                onClick={handleAssign}
              >
                {assignMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                Phân công xử lý
              </Button>
            </div>
          ) : null}

          {customerCase.status === 'SUBMITTED' ? (
            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-600" />
                <h3 className="font-semibold text-slate-900">
                  Tiếp nhận hồ sơ
                </h3>
              </div>
              <Textarea
                value={acknowledgeNote}
                placeholder="Ghi chú tiếp nhận, không bắt buộc"
                disabled={isMutating}
                onChange={(event) => setAcknowledgeNote(event.target.value)}
              />
              <Button
                size="sm"
                disabled={isMutating}
                onClick={handleAcknowledge}
              >
                {acknowledgeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Xác nhận tiếp nhận
              </Button>
            </div>
          ) : null}

          {isOpen && isTechnicalCategory ? (
            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-brand-600" />
                <h3 className="font-semibold text-slate-900">
                  Đánh giá kỹ thuật
                </h3>
              </div>
              <Select
                value={inspectorProfileId}
                disabled={
                  isLoadingStaff ||
                  isMutating ||
                  detail.technical_assessment?.status === 'SUBMITTED'
                }
                onChange={(event) =>
                  setInspectorProfileId(event.target.value)
                }
              >
                <option value="">Chọn nhân viên kiểm tra xe</option>
                {eligibleInspectors.map((record) => (
                  <option key={record.profile.id} value={record.profile.id}>
                    {record.user.full_name} · {record.profile.staff_code}
                  </option>
                ))}
              </Select>
              <Button
                size="sm"
                variant="secondary"
                disabled={
                  isMutating ||
                  !inspectorProfileId ||
                  detail.technical_assessment?.status === 'SUBMITTED'
                }
                onClick={handleAssignTechnicalAssessment}
              >
                {technicalAssignMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wrench className="h-4 w-4" />
                )}
                Phân công đánh giá
              </Button>
              {detail.technical_assessment?.status === 'SUBMITTED' ? (
                <p className="text-xs text-emerald-700">
                  Đánh giá đã được nộp và không thể phân công lại.
                </p>
              ) : null}
            </div>
          ) : null}

          {isOpen ? (
            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-brand-600" />
                <h3 className="font-semibold text-slate-900">
                  Phương án giải quyết
                </h3>
              </div>
              <p className="text-sm text-slate-600">
                {hasAcceptedResolution
                  ? 'Phương án đã được khách chấp nhận và phải được áp dụng trước khi tạo phương án mới.'
                  : canProposeResolution
                    ? 'Tạo phương án để khách hàng chấp nhận hoặc từ chối.'
                    : 'Phân loại này cần đánh giá kỹ thuật đã nộp trước khi đề xuất phương án.'}
              </p>
              <Button
                size="sm"
                disabled={isMutating || !canProposeResolution}
                onClick={() => setModal('RESOLUTION')}
              >
                <Plus className="h-4 w-4" />
                Đề xuất phương án
              </Button>
            </div>
          ) : null}

          {canConclude ? (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-emerald-700" />
                <h3 className="font-semibold text-slate-900">
                  Kết luận hồ sơ
                </h3>
              </div>
              <p className="text-sm text-slate-600">
                Phương án đã được áp dụng. Admin có thể ghi kết luận chính thức.
              </p>
              <Button
                size="sm"
                disabled={isMutating}
                onClick={() => setModal('CONCLUDE')}
              >
                <FileCheck2 className="h-4 w-4" />
                Ghi kết luận
              </Button>
            </div>
          ) : null}

          {customerCase.status === 'RESOLVED' ? (
            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-600" />
                <h3 className="font-semibold text-slate-900">Đóng hồ sơ</h3>
              </div>
              <p className="text-sm text-slate-600">
                Hồ sơ đã có kết luận và có thể được đóng.
              </p>
              <Button
                size="sm"
                disabled={isMutating}
                onClick={() => setModal('CLOSE')}
              >
                Đóng hồ sơ
              </Button>
            </div>
          ) : null}

          {['RESOLVED', 'CLOSED'].includes(customerCase.status) ? (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <div className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4 text-amber-700" />
                <h3 className="font-semibold text-slate-900">Mở lại hồ sơ</h3>
              </div>
              <p className="text-sm text-slate-600">
                Admin có thể mở lại để điều tra thêm, không bị giới hạn 7 ngày.
              </p>
              <Button
                size="sm"
                variant="secondary"
                disabled={isMutating}
                onClick={() => setModal('REOPEN')}
              >
                <RefreshCcw className="h-4 w-4" />
                Mở lại
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {detail.technical_assessment ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Đánh giá kỹ thuật</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoRow
              label="Trạng thái"
              value={
                TECHNICAL_STATUS_LABELS[
                  detail.technical_assessment.status
                ] ?? detail.technical_assessment.status
              }
            />
            <InfoRow
              label="Mức độ"
              value={
                detail.technical_assessment.severity
                  ? SEVERITY_LABELS[
                      detail.technical_assessment.severity
                    ] ?? detail.technical_assessment.severity
                  : '—'
              }
            />
            <InfoRow
              label="Bắt đầu"
              value={
                detail.technical_assessment.started_at
                  ? formatDateTime(detail.technical_assessment.started_at)
                  : '—'
              }
            />
            <InfoRow
              label="Nộp lúc"
              value={
                detail.technical_assessment.submitted_at
                  ? formatDateTime(detail.technical_assessment.submitted_at)
                  : '—'
              }
            />
            {detail.technical_assessment.findings ? (
              <TextBlock
                label="Kết quả kiểm tra"
                value={detail.technical_assessment.findings}
              />
            ) : null}
            {detail.technical_assessment.root_cause ? (
              <TextBlock
                label="Nguyên nhân gốc"
                value={detail.technical_assessment.root_cause}
              />
            ) : null}
            {detail.technical_assessment.recommended_resolution ? (
              <TextBlock
                label="Khuyến nghị"
                value={detail.technical_assessment.recommended_resolution}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {customerCase.conclusion ? (
        <Card className="mb-6 border-emerald-200">
          <CardHeader>
            <CardTitle>Kết luận chính thức</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              label="Trách nhiệm"
              value={
                LIABILITY_LABELS[
                  customerCase.liability_status ?? 'UNDETERMINED'
                ]
              }
            />
            <TextBlock label="Kết luận" value={customerCase.conclusion} />
            {customerCase.resolution_summary ? (
              <TextBlock
                label="Tóm tắt giải quyết"
                value={customerCase.resolution_summary}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Phương án giải quyết</CardTitle>
        </CardHeader>
        <CardContent>
          <ResolutionList
            items={detail.resolutions}
            disabled={isMutating}
            onApply={(resolution) => {
              setSelectedResolution(resolution)
              setModal('APPLY')
            }}
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Hoàn tiền</CardTitle>
        </CardHeader>
        <CardContent>
          <RefundList
            items={detail.refunds}
            disabled={isMutating}
            onUpdate={(refund) => {
              setSelectedRefund(refund)
              setRefundStatus(
                refund.status === 'APPROVED' ? 'PROCESSING' : refund.status,
              )
              setRefundReference(refund.transaction_reference ?? '')
              setRefundNote(refund.note ?? '')
              setRefundFailureReason(refund.failure_reason ?? '')
              setModal('REFUND')
            }}
          />
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bằng chứng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EvidenceList items={customerCase.evidence ?? []} />
            {isOpen ? (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <Label htmlFor="admin-case-evidence">
                  Thêm hình ảnh bằng chứng
                </Label>
                <input
                  key={evidenceInputKey}
                  id="admin-case-evidence"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  disabled={isMutating}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-medium file:text-brand-700"
                  onChange={(event) =>
                    setEvidenceFiles(
                      Array.from(event.target.files ?? []).slice(0, 10),
                    )
                  }
                />
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isMutating || evidenceFiles.length === 0}
                  onClick={handleUploadEvidence}
                >
                  {isUploading ? (
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

        <Card>
          <CardHeader>
            <CardTitle>Trao đổi với khách hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MessageList items={detail.messages} />
            {isOpen ? (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <Textarea
                  value={message}
                  disabled={isMutating}
                  placeholder="Nhập nội dung trao đổi với khách hàng"
                  onChange={(event) => setMessage(event.target.value)}
                />
                <Button
                  size="sm"
                  disabled={isMutating || !message.trim()}
                  onClick={handleSendMessage}
                >
                  {messageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Gửi tin nhắn
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timeline hồ sơ</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline items={detail.timeline} />
        </CardContent>
      </Card>

      <Modal
        open={modal === 'RESOLUTION'}
        onClose={() => setModal(null)}
        title="Đề xuất phương án giải quyết"
        description="Khách hàng phải chấp nhận phương án trước khi Admin có thể áp dụng."
        className="max-w-4xl"
      >
        <div className="space-y-5">
          <div>
            <Label htmlFor="resolution-summary">Tóm tắt phương án</Label>
            <Textarea
              id="resolution-summary"
              value={resolutionSummary}
              placeholder="Mô tả đầy đủ phương án gửi khách hàng"
              onChange={(event) => setResolutionSummary(event.target.value)}
            />
          </div>
          <div className="space-y-4">
            {resolutionActions.map((action, index) => (
              <ResolutionActionFields
                key={action.key}
                index={index}
                action={action}
                isWalkIn={customerCase.is_walk_in_case}
                servicePackages={servicePackages}
                canRemove={resolutionActions.length > 1}
                onChange={(patch) =>
                  updateResolutionAction(action.key, patch)
                }
                onRemove={() =>
                  setResolutionActions((current) =>
                    current.filter((item) => item.key !== action.key),
                  )
                }
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={resolutionActions.length >= 3}
              onClick={() =>
                setResolutionActions((current) => [
                  ...current,
                  createActionDraft('REFUND'),
                ])
              }
            >
              <Plus className="h-4 w-4" />
              Thêm hành động
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setModal(null)}>
                Hủy
              </Button>
              <Button
                disabled={proposeMutation.isPending}
                onClick={handleProposeResolution}
              >
                {proposeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Gửi phương án
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === 'APPLY'}
        onClose={() => {
          setModal(null)
          setSelectedResolution(null)
        }}
        title="Áp dụng phương án"
        description="Thao tác này có thể tạo hoàn tiền, voucher, booking làm lại hoặc miễn giảm phí."
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Xác nhận áp dụng phương án phiên bản{' '}
            <strong>{selectedResolution?.version}</strong> đã được khách hàng
            chấp nhận.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setModal(null)
                setSelectedResolution(null)
              }}
            >
              Hủy
            </Button>
            <Button
              disabled={applyMutation.isPending}
              onClick={handleApplyResolution}
            >
              {applyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Áp dụng
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === 'CONCLUDE'}
        onClose={() => setModal(null)}
        title="Kết luận hồ sơ"
        description="Kết luận chỉ được ghi sau khi phương án đã áp dụng thành công."
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="case-liability">Kết luận trách nhiệm</Label>
            <Select
              id="case-liability"
              value={liabilityStatus}
              onChange={(event) =>
                setLiabilityStatus(
                  event.target.value as Exclude<
                    CustomerCaseLiabilityStatus,
                    'UNDETERMINED'
                  >,
                )
              }
            >
              {LIABILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="case-conclusion">Nội dung kết luận</Label>
            <Textarea
              id="case-conclusion"
              value={conclusion}
              onChange={(event) => setConclusion(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="case-resolution-summary">
              Tóm tắt cách giải quyết
            </Label>
            <Textarea
              id="case-resolution-summary"
              value={conclusionResolutionSummary}
              onChange={(event) =>
                setConclusionResolutionSummary(event.target.value)
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModal(null)}>
              Hủy
            </Button>
            <Button
              disabled={concludeMutation.isPending}
              onClick={handleConclude}
            >
              {concludeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Lưu kết luận
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === 'CLOSE'}
        onClose={() => setModal(null)}
        title="Đóng hồ sơ"
        description="Hồ sơ đã đóng không nhận thêm tin nhắn hoặc bằng chứng."
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="case-close-note">Ghi chú đóng hồ sơ</Label>
            <Textarea
              id="case-close-note"
              value={closeNote}
              onChange={(event) => setCloseNote(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModal(null)}>
              Hủy
            </Button>
            <Button
              disabled={closeMutation.isPending}
              onClick={handleClose}
            >
              {closeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Xác nhận đóng
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === 'REFUND'}
        onClose={() => {
          setModal(null)
          setSelectedRefund(null)
        }}
        title="Cập nhật hoàn tiền"
        description={
          selectedRefund
            ? `${formatPrice(selectedRefund.amount)} · ${REFUND_METHOD_LABELS[selectedRefund.method]}`
            : undefined
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="refund-status">Trạng thái</Label>
            <Select
              id="refund-status"
              value={refundStatus}
              onChange={(event) =>
                setRefundStatus(
                  event.target.value as Exclude<
                    CustomerCaseRefundStatus,
                    'APPROVED'
                  >,
                )
              }
            >
              <option value="PROCESSING">Đang xử lý</option>
              <option value="COMPLETED">Hoàn tất</option>
              <option value="FAILED">Thất bại</option>
            </Select>
          </div>
          {refundStatus === 'COMPLETED' ? (
            <div>
              <Label htmlFor="refund-reference">Mã giao dịch</Label>
              <Input
                id="refund-reference"
                value={refundReference}
                onChange={(event) => setRefundReference(event.target.value)}
              />
            </div>
          ) : null}
          {refundStatus === 'FAILED' ? (
            <div>
              <Label htmlFor="refund-failure-reason">Lý do thất bại</Label>
              <Textarea
                id="refund-failure-reason"
                value={refundFailureReason}
                onChange={(event) =>
                  setRefundFailureReason(event.target.value)
                }
              />
            </div>
          ) : null}
          <div>
            <Label htmlFor="refund-note">Ghi chú</Label>
            <Textarea
              id="refund-note"
              value={refundNote}
              onChange={(event) => setRefundNote(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setModal(null)
                setSelectedRefund(null)
              }}
            >
              Hủy
            </Button>
            <Button
              disabled={refundMutation.isPending}
              onClick={handleUpdateRefund}
            >
              {refundMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Cập nhật
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === 'REOPEN'}
        onClose={() => setModal(null)}
        title="Mở lại hồ sơ"
        description="Kết luận cũ sẽ được lưu trong timeline, còn hồ sơ trở về trạng thái đang xác minh."
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="case-reopen-reason">Lý do mở lại</Label>
            <Textarea
              id="case-reopen-reason"
              value={reopenReason}
              onChange={(event) => setReopenReason(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModal(null)}>
              Hủy
            </Button>
            <Button
              disabled={reopenMutation.isPending}
              onClick={handleReopen}
            >
              {reopenMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Xác nhận mở lại
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ResolutionActionFields({
  index,
  action,
  isWalkIn,
  servicePackages,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number
  action: ResolutionActionDraft
  isWalkIn: boolean
  servicePackages: Array<{ id: string; name: string }>
  canRemove: boolean
  onChange: (patch: Partial<ResolutionActionDraft>) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-900">
          Hành động {index + 1}
        </h3>
        {canRemove ? (
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Xóa hành động ${index + 1}`}
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Loại hành động</Label>
          <Select
            value={action.action_type}
            onChange={(event) =>
              onChange({
                action_type: event.target
                  .value as CustomerCaseResolutionActionType,
              })
            }
          >
            <option value="NO_COMPENSATION">Không bồi thường</option>
            <option value="REFUND">Hoàn tiền</option>
            {!isWalkIn ? (
              <option value="VOUCHER">Voucher bồi thường</option>
            ) : null}
            <option value="REWORK">Thực hiện lại dịch vụ</option>
            <option value="WAIVE_CHARGE">Miễn giảm phí</option>
          </Select>
        </div>

        {['REFUND', 'WAIVE_CHARGE'].includes(action.action_type) ? (
          <div>
            <Label>Số tiền</Label>
            <Input
              type="number"
              min="1"
              value={action.amount}
              onChange={(event) => onChange({ amount: event.target.value })}
            />
          </div>
        ) : null}

        {action.action_type === 'REFUND' ? (
          <div>
            <Label>Phương thức hoàn</Label>
            <Select
              value={action.refund_method}
              onChange={(event) =>
                onChange({
                  refund_method: event.target.value as CustomerCaseRefundMethod,
                })
              }
            >
              {Object.entries(REFUND_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {action.action_type === 'VOUCHER' ? (
          <>
            <div>
              <Label>Loại voucher</Label>
              <Select
                value={action.voucher_type}
                onChange={(event) =>
                  onChange({
                    voucher_type: event.target
                      .value as CustomerCaseVoucherType,
                  })
                }
              >
                <option value="FIXED_AMOUNT">Giảm số tiền cố định</option>
                <option value="PERCENTAGE">Giảm theo phần trăm</option>
                <option value="FREE_SERVICE">Miễn phí gói dịch vụ</option>
              </Select>
            </div>
            <div>
              <Label>Hạn sử dụng</Label>
              <Input
                type="datetime-local"
                value={action.expires_at}
                onChange={(event) =>
                  onChange({ expires_at: event.target.value })
                }
              />
            </div>
            {action.voucher_type !== 'FREE_SERVICE' ? (
              <div>
                <Label>
                  {action.voucher_type === 'PERCENTAGE'
                    ? 'Phần trăm giảm'
                    : 'Giá trị giảm'}
                </Label>
                <Input
                  type="number"
                  min="1"
                  max={
                    action.voucher_type === 'PERCENTAGE' ? '100' : undefined
                  }
                  value={action.value}
                  onChange={(event) =>
                    onChange({ value: event.target.value })
                  }
                />
              </div>
            ) : null}
            {action.voucher_type === 'PERCENTAGE' ? (
              <div>
                <Label>Giảm tối đa</Label>
                <Input
                  type="number"
                  min="1"
                  value={action.max_discount_amount}
                  onChange={(event) =>
                    onChange({ max_discount_amount: event.target.value })
                  }
                />
              </div>
            ) : null}
            <div>
              <Label>Đơn hàng tối thiểu</Label>
              <Input
                type="number"
                min="0"
                value={action.min_order_amount}
                onChange={(event) =>
                  onChange({ min_order_amount: event.target.value })
                }
              />
            </div>
            {action.voucher_type === 'FREE_SERVICE' ? (
              <div>
                <Label>Gói dịch vụ miễn phí</Label>
                <Select
                  value={action.service_package_id}
                  onChange={(event) =>
                    onChange({ service_package_id: event.target.value })
                  }
                >
                  <option value="">Chọn gói dịch vụ</option>
                  {servicePackages.map((servicePackage) => (
                    <option
                      key={servicePackage.id}
                      value={servicePackage.id}
                    >
                      {servicePackage.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
          </>
        ) : null}

        {action.action_type === 'REWORK' ? (
          <>
            <div>
              <Label>Thời gian thực hiện lại</Label>
              <Input
                type="datetime-local"
                value={action.rework_start_time}
                onChange={(event) =>
                  onChange({ rework_start_time: event.target.value })
                }
              />
            </div>
            <div>
              <Label>Gói dịch vụ thay thế</Label>
              <Select
                value={action.service_package_id}
                onChange={(event) =>
                  onChange({ service_package_id: event.target.value })
                }
              >
                <option value="">Giữ gói dịch vụ hiện tại</option>
                {servicePackages.map((servicePackage) => (
                  <option key={servicePackage.id} value={servicePackage.id}>
                    {servicePackage.name}
                  </option>
                ))}
              </Select>
            </div>
          </>
        ) : null}

        <div className="md:col-span-2">
          <Label>Ghi chú hành động</Label>
          <Textarea
            value={action.note}
            onChange={(event) => onChange({ note: event.target.value })}
          />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  )
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="md:col-span-2 xl:col-span-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
        {value}
      </p>
    </div>
  )
}

function ResolutionList({
  items,
  disabled,
  onApply,
}: {
  items: ApiCustomerCaseResolution[]
  disabled: boolean
  onApply: (item: ApiCustomerCaseResolution) => void
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có phương án nào.</p>
  }
  return (
    <div className="space-y-4">
      {items.map((resolution) => (
        <div
          key={resolution.id}
          className="rounded-xl border border-slate-200 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">
                Phiên bản {resolution.version}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {resolution.summary}
              </p>
            </div>
            <Badge variant={resolutionStatusVariant(resolution.status)}>
              {RESOLUTION_STATUS_LABELS[resolution.status] ??
                resolution.status}
            </Badge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {resolution.actions.map((action, index) => (
              <ResolutionActionView
                key={action.id ?? `${resolution.id}-${index}`}
                action={action}
              />
            ))}
          </div>
          {resolution.customer_response_note ? (
            <p className="mt-3 text-sm text-slate-600">
              Phản hồi của khách: {resolution.customer_response_note}
            </p>
          ) : null}
          {resolution.failure_reason ? (
            <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">
              Lỗi áp dụng: {resolution.failure_reason}
            </p>
          ) : null}
          {['CUSTOMER_ACCEPTED', 'FAILED'].includes(resolution.status) ? (
            <Button
              className="mt-4"
              size="sm"
              disabled={disabled}
              onClick={() => onApply(resolution)}
            >
              {resolution.status === 'FAILED'
                ? 'Thử áp dụng lại'
                : 'Áp dụng phương án'}
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function ResolutionActionView({
  action,
}: {
  action: ApiCustomerCaseResolutionAction
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-sm">
      <p className="font-semibold text-slate-900">
        {ACTION_TYPE_LABELS[action.action_type]}
      </p>
      {action.amount ? (
        <p className="mt-1 text-slate-600">{formatPrice(action.amount)}</p>
      ) : null}
      {action.refund_method ? (
        <p className="mt-1 text-slate-600">
          {REFUND_METHOD_LABELS[action.refund_method]}
        </p>
      ) : null}
      {action.voucher_type ? (
        <p className="mt-1 text-slate-600">
          Voucher {action.voucher_type}
          {action.value !== null && action.value !== undefined
            ? ` · ${action.value}`
            : ''}
        </p>
      ) : null}
      {action.rework_start_time ? (
        <p className="mt-1 text-slate-600">
          {formatDateTime(action.rework_start_time)}
        </p>
      ) : null}
      {action.note ? (
        <p className="mt-1 whitespace-pre-wrap text-slate-600">
          {action.note}
        </p>
      ) : null}
    </div>
  )
}

function RefundList({
  items,
  disabled,
  onUpdate,
}: {
  items: ApiCustomerCaseRefund[]
  disabled: boolean
  onUpdate: (item: ApiCustomerCaseRefund) => void
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Chưa phát sinh hoàn tiền.</p>
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((refund) => (
        <div
          key={refund.id}
          className="rounded-xl border border-slate-200 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-slate-900">
                {formatPrice(refund.amount)}
              </p>
              <p className="text-sm text-slate-600">
                {REFUND_METHOD_LABELS[refund.method]}
              </p>
            </div>
            <Badge variant={refundStatusVariant(refund.status)}>
              {REFUND_STATUS_LABELS[refund.status]}
            </Badge>
          </div>
          {refund.transaction_reference ? (
            <p className="mt-3 text-sm text-slate-600">
              Mã giao dịch: {refund.transaction_reference}
            </p>
          ) : null}
          {refund.failure_reason ? (
            <p className="mt-2 text-sm text-red-700">
              {refund.failure_reason}
            </p>
          ) : null}
          {refund.status !== 'COMPLETED' ? (
            <Button
              className="mt-4"
              size="sm"
              variant="secondary"
              disabled={disabled}
              onClick={() => onUpdate(refund)}
            >
              Cập nhật hoàn tiền
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function EvidenceList({ items }: { items: ApiCustomerCaseEvidence[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có bằng chứng.</p>
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((evidence) =>
        evidence.url ? (
          <a
            key={evidence.id}
            href={evidence.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-200 p-3 text-sm hover:bg-slate-50"
          >
            <p className="font-medium text-slate-900">
              {evidence.mime_type ?? 'Hình ảnh'}
            </p>
            <p className="truncate text-slate-500">{evidence.url}</p>
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

function MessageList({ items }: { items: ApiCustomerCaseMessage[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có tin nhắn.</p>
  }
  return (
    <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-slate-200 p-3 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-slate-900">
              {item.sender?.full_name ?? item.sender_role}
            </p>
            <span className="text-xs text-slate-500">
              {item.created_at ? formatDateTime(item.created_at) : ''}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-slate-700">
            {item.message}
          </p>
        </div>
      ))}
    </div>
  )
}

function Timeline({ items }: { items: ApiCustomerCaseTimelineEvent[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Chưa có sự kiện"
        description="Timeline sẽ cập nhật khi hồ sơ có hoạt động."
      />
    )
  }
  return (
    <div className="space-y-3">
      {items.map((event) => (
        <div
          key={event.id}
          className="flex flex-wrap items-start gap-3 border-l-2 border-brand-200 pl-4"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-900">
              {EVENT_LABELS[event.event_type] ?? event.event_type}
            </p>
            {event.from_status && event.to_status ? (
              <p className="text-sm text-slate-600">
                {CASE_STATUS_LABELS[event.from_status]} →{' '}
                {CASE_STATUS_LABELS[event.to_status]}
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
        </div>
      ))}
    </div>
  )
}
