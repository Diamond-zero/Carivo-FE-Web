import { ArrowLeft, ArrowRightLeft, UserX } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminStaffForm } from '../../../components/admin/staff/AdminStaffForm'
import { AdminStaffTypeChangeRequestModal } from '../../../components/admin/staff/AdminStaffTypeChangeRequestModal'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminStaffProfile,
  useCreateAdminStaff,
  useToggleAdminStaffStatus,
  useUpdateAdminStaff,
} from '../../../hooks/api/admin/useAdminStaff'
import {
  useAdminStaffTypeChangeRequests,
} from '../../../hooks/api/admin/useAdminStaffTypeChangeRequests'
import { STAFF_TYPE_LABELS } from '../../../constants/staffType'
import type {
  AdminStaffCreateFormValues,
  AdminStaffEditFormValues,
} from '../../../lib/validations/adminStaff'
import type { StaffType } from '../../../types/staffProfile'

export function AdminStaffFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profileId } = useParams<{ profileId: string }>()
  const { showToast } = useToast()

  const isCreate = location.pathname.endsWith('/new')
  const profileQuery = useAdminStaffProfile(!isCreate ? profileId : undefined)
  const createMutation = useCreateAdminStaff()
  const updateMutation = useUpdateAdminStaff()
  const toggleStatusMutation = useToggleAdminStaffStatus()

  const [transferOpen, setTransferOpen] = useState(false)

  // Lấy danh sách request đang mở của staff để cảnh báo admin nếu đã có yêu cầu
  // đang pending (BE vẫn cho phép tạo thêm nhưng thường gây trùng).
  const openRequestsQuery = useAdminStaffTypeChangeRequests({
    staff_profile_id: profileId,
  })
  const record = profileQuery.data ?? undefined
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isLoading = !isCreate && profileQuery.isLoading

  // Request thuộc staff hiện tại còn ở trạng thái mở (REQUESTED/APPROVED/SCHEDULED).
  const openRequestsForThisStaff =
    openRequestsQuery.data?.data?.filter((req) =>
      ['REQUESTED', 'APPROVED', 'SCHEDULED'].includes(req.status),
    ) ?? []

  if (!isCreate && !isLoading && (profileQuery.isError || !record)) {
    return (
      <div>
        <PageHeader
          title="Không tìm thấy nhân viên"
          description="Hồ sơ nhân viên không tồn tại trong hệ thống."
          action={
            <Link to="/admin/users/staff">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách
              </Button>
            </Link>
          }
        />
        <EmptyState
          icon={UserX}
          title="Hồ sơ không tồn tại"
          description={getApiErrorMessage(
            profileQuery.error,
            'Mã hồ sơ không khớp với dữ liệu hệ thống.',
          )}
          action={
            <Link to="/admin/users/staff">
              <Button>Về danh sách nhân viên</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const handleCreateSubmit = async (values: AdminStaffCreateFormValues) => {
    const garageId =
      values.garage_id && values.garage_id.length > 0 ? values.garage_id : null
    // BE createStaffProfileSchema (.strict()) chỉ nhận user_id, staff_code,
    // staff_type, garage_id — KHÔNG nhận is_active. Staff mới tạo mặc định
    // is_active = true; nếu admin muốn khoá ngay, phải gọi endpoint riêng
    // PATCH /staff-profiles/:id/status.
    createMutation.mutate(
      {
        user_id: values.user_id,
        staff_code: values.staff_code,
        staff_type: values.staff_type as StaffType,
        garage_id: garageId,
      },
      {
        onSuccess: (created) => {
          showToast(`Đã tạo hồ sơ ${created.profile.staff_code}.`, 'success')
          navigate('/admin/users/staff')
        },
        onError: (error) => {
          showToast(
            getApiErrorMessage(error, 'Không thể tạo hồ sơ nhân viên.'),
            'error',
          )
        },
      },
    )
  }

  const handleEditSubmit = async (values: AdminStaffEditFormValues) => {
    if (!profileId) return
    const garageId =
      values.garage_id && values.garage_id.length > 0 ? values.garage_id : null
    // BE StaffProfileUpdateRequest (PATCH /staff-profiles/:id) chỉ nhận
    // `staff_code` và `garage_id` — schema `.strict()` sẽ reject field lạ.
    //   - `staff_type` phải đổi qua workflow "Điều chuyển vị trí"
    //     (AdminStaffTypeChangeRequestModal) để BE audit + revoke refresh token.
    //   - `is_active` phải đổi qua endpoint riêng
    //     PATCH /staff-profiles/:id/status (toggleStaffProfileStatusApi).
    updateMutation.mutate(
      {
        profileId,
        payload: {
          staff_code: values.staff_code,
          garage_id: garageId,
        },
      },
      {
        onSuccess: (updated) => {
          showToast(`Đã cập nhật ${updated.profile.staff_code}.`, 'success')
          navigate('/admin/users/staff')
        },
        onError: (error) => {
          showToast(
            getApiErrorMessage(error, 'Không thể cập nhật hồ sơ nhân viên.'),
            'error',
          )
        },
      },
    )
  }

  const canTransfer =
    !isCreate && Boolean(record) && record?.profile.is_active === true

  const handleToggleStatus = () => {
    if (!profileId || !record) return
    const nextIsActive = !record.profile.is_active
    const confirmMessage = nextIsActive
      ? 'Mở khoá nhân viên này? Họ sẽ có thể đăng nhập và nhận booking.'
      : 'Khoá nhân viên này? Họ sẽ không thể đăng nhập và nhận booking.'
    if (typeof window !== 'undefined' && !window.confirm(confirmMessage)) {
      return
    }
    toggleStatusMutation.mutate(
      { profileId, isActive: nextIsActive },
      {
        onSuccess: (updated) => {
          showToast(
            nextIsActive
              ? `Đã mở khoá ${updated.profile.staff_code}.`
              : `Đã khoá ${updated.profile.staff_code}.`,
            'success',
          )
        },
        onError: (error) => {
          showToast(
            getApiErrorMessage(error, 'Không thể đổi trạng thái nhân viên.'),
            'error',
          )
        },
      },
    )
  }

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Quản trị"
            title={isCreate ? 'Thêm nhân viên' : 'Sửa hồ sơ nhân viên'}
            description={
              isCreate
                ? 'Gán tài khoản STAFF vào garage với mã nhân viên và vai trò.'
                : `Chỉnh sửa ${record?.user.full_name} — ${record?.profile.staff_code} · Hiện tại: ${STAFF_TYPE_LABELS[record?.profile.staff_type ?? 'CUSTOMER_SERVICE_STAFF']}`
            }
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Link to="/admin/users/staff">
                  <Button variant="secondary">
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                  </Button>
                </Link>
                {!isCreate && record ? (
                  <Button
                    onClick={() => setTransferOpen(true)}
                    disabled={!canTransfer}
                    title={
                      canTransfer
                        ? 'Tạo yêu cầu điều chuyển nhân viên sang chức năng khác (cần admin khác duyệt)'
                        : 'Chỉ điều chuyển được khi nhân viên đang làm việc'
                    }
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    Điều chuyển vị trí
                  </Button>
                ) : null}
              </div>
            }
          />

          {!isCreate && openRequestsForThisStaff.length > 0 ? (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <ArrowRightLeft className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium">
                  Nhân viên này đang có {openRequestsForThisStaff.length} yêu
                  cầu đổi chức năng chưa kết thúc.
                </p>
                <ul className="ml-4 mt-1 list-disc text-xs">
                  {openRequestsForThisStaff.map((req) => (
                    <li key={req.id}>
                      Mã yêu cầu{' '}
                      <Link
                        to={`/admin/staff-type-change-requests/${req.id}`}
                        className="carivo-link font-mono"
                      >
                        #{req.id.slice(0, 8)}
                      </Link>
                      {' · '}
                      {STAFF_TYPE_LABELS[
                        req.to_staff_type as keyof typeof STAFF_TYPE_LABELS
                      ] ?? req.to_staff_type}
                      {' · '}
                      {req.status}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base">Thông tin hồ sơ</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminStaffForm
                mode={isCreate ? 'create' : 'edit'}
                initialRecord={record}
                onSubmit={
                  isCreate
                    ? handleCreateSubmit
                    : (handleEditSubmit as (
                        values: AdminStaffEditFormValues,
                      ) => Promise<void>)
                }
                isSubmitting={isSubmitting}
                statusControl={
                  !isCreate && record
                    ? {
                        isActive: record.profile.is_active,
                        isToggling: toggleStatusMutation.isPending,
                        onToggle: handleToggleStatus,
                      }
                    : undefined
                }
              />
            </CardContent>
          </Card>

          {!isCreate && record ? (
            <AdminStaffTypeChangeRequestModal
              open={transferOpen}
              record={record}
              onClose={() => setTransferOpen(false)}
              onSubmitted={(created) => {
                setTransferOpen(false)
                // Mở thẳng trang detail để admin xem lý do, impact và duyệt/từ chối.
                navigate(`/admin/staff-type-change-requests/${created.id}`)
              }}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
