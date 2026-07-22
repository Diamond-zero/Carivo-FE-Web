import { ArrowLeft, UserX } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminStaffForm } from '../../../components/admin/staff/AdminStaffForm'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminStaffProfile,
  useCreateAdminStaff,
  useUpdateAdminStaff,
} from '../../../hooks/api/admin/useAdminStaff'
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

  const record = profileQuery.data ?? undefined
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isLoading = !isCreate && profileQuery.isLoading

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
    createMutation.mutate(
      {
        user_id: values.user_id,
        staff_code: values.staff_code,
        staff_type: values.staff_type as StaffType,
        garage_id: garageId,
        is_active: values.is_active,
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
    // BE StaffProfileUpdateRequest KHÔNG nhận staff_type.
    updateMutation.mutate(
      {
        profileId,
        payload: {
          staff_code: values.staff_code,
          garage_id: garageId,
          is_active: values.is_active,
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
                : `Chỉnh sửa ${record?.user.full_name} — ${record?.profile.staff_code}`
            }
            action={
              <Link to="/admin/users/staff">
                <Button variant="secondary">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </Button>
              </Link>
            }
          />

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
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
