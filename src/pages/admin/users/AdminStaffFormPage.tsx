import { ArrowLeft, UserX } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AdminStaffForm } from '../../../components/admin/staff/AdminStaffForm'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import { useInitialPageSkeleton } from '../../../hooks/useInitialPageSkeleton'
import type { AdminStaffFormValues } from '../../../lib/validations/adminStaff'
import {
  createAdminStaffRecord,
  getAdminStaffRecordByProfileId,
  updateAdminStaffRecord,
} from '../../../mocks/admin/adminStaffStore'
import type { StaffType } from '../../../types/staffProfile'

export function AdminStaffFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profileId } = useParams<{ profileId: string }>()
  const { showToast } = useToast()
  const isLoading = useInitialPageSkeleton(240)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isCreate = location.pathname.endsWith('/new')
  const record =
    !isCreate && profileId ? getAdminStaffRecordByProfileId(profileId) : undefined

  if (!isLoading && !isCreate && !record) {
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
          description="Mã hồ sơ không khớp với dữ liệu mock Admin."
          action={
            <Link to="/admin/users/staff">
              <Button>Về danh sách nhân viên</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const handleSubmit = async (values: AdminStaffFormValues) => {
    setIsSubmitting(true)

    try {
      if (isCreate) {
        const result = createAdminStaffRecord({
          user_id: values.user_id,
          staff_code: values.staff_code,
          staff_type: values.staff_type as StaffType,
          garage_id: values.garage_id,
          is_active: values.is_active,
        })

        if (!result.ok) {
          showToast(result.message, 'error')
          return
        }

        showToast(`Đã tạo hồ sơ ${result.record.profile.staff_code}.`, 'success')
        navigate('/admin/users/staff')
        return
      }

      if (!profileId) return

      const result = updateAdminStaffRecord(profileId, {
        staff_code: values.staff_code,
        staff_type: values.staff_type as StaffType,
        garage_id: values.garage_id,
        is_active: values.is_active,
      })

      if (!result.ok) {
        showToast(result.message, 'error')
        return
      }

      showToast(`Đã cập nhật ${result.record.profile.staff_code}.`, 'success')
      navigate('/admin/users/staff')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Admin"
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
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
