import { ArrowLeft, Package } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminServicePackageForm } from '../../../components/admin/servicePackage/AdminServicePackageForm'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminServicePackage,
  useCreateAdminServicePackage,
  useUpdateAdminServicePackage,
} from '../../../hooks/api/admin/useAdminServicePackages'
import type { AdminServicePackageFormValues } from '../../../lib/validations/adminServicePackage'

export function AdminServicePackageFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { packageId } = useParams<{ packageId: string }>()
  const { showToast } = useToast()

  const isCreate = location.pathname.endsWith('/new')
  const packageQuery = useAdminServicePackage(!isCreate ? packageId : undefined)
  const createMutation = useCreateAdminServicePackage()
  const updateMutation = useUpdateAdminServicePackage()

  const pkg = packageQuery.data
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isLoading = !isCreate && packageQuery.isLoading

  if (!isCreate && !isLoading && (packageQuery.isError || !pkg)) {
    return (
      <div>
        <PageHeader
          title="Không tìm thấy gói dịch vụ"
          description="Gói dịch vụ không tồn tại trong hệ thống."
          action={
            <Link to="/admin/services/packages">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách
              </Button>
            </Link>
          }
        />
        <EmptyState
          icon={Package}
          title="Gói không tồn tại"
          description={getApiErrorMessage(
            packageQuery.error,
            'Mã gói không khớp với dữ liệu hệ thống.',
          )}
          action={
            <Link to="/admin/services/packages">
              <Button>Về danh sách gói dịch vụ</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const handleSubmit = async (values: AdminServicePackageFormValues) => {
    const payload = {
      name: values.name,
      vehicle_type: values.vehicle_type,
      service_type: values.service_type,
      description: values.description,
      base_price: values.base_price,
      duration_minutes: values.duration_minutes,
      wash_bay_duration_minutes: values.requires_wash_bay
        ? values.wash_bay_duration_minutes ?? null
        : null,
      points_earned: values.points_earned,
      requires_wash_bay: values.requires_wash_bay,
      requires_care_staff: values.requires_care_staff,
      included_service_ids:
        values.service_type === 'COMBO' ? values.included_service_ids : [],
      is_active: values.is_active,
    }

    if (isCreate) {
      createMutation.mutate(payload, {
        onSuccess: (created) => {
          showToast(`Đã tạo gói ${created.name}.`, 'success')
          navigate('/admin/services/packages')
        },
        onError: (error) => {
          showToast(getApiErrorMessage(error, 'Không thể tạo gói dịch vụ.'), 'error')
        },
      })
      return
    }

    if (!packageId) return

    updateMutation.mutate(
      { packageId, payload },
      {
        onSuccess: (updated) => {
          showToast(`Đã cập nhật ${updated.name}.`, 'success')
          navigate('/admin/services/packages')
        },
        onError: (error) => {
          showToast(getApiErrorMessage(error, 'Không thể cập nhật gói dịch vụ.'), 'error')
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
            title={isCreate ? 'Thêm gói dịch vụ' : 'Sửa gói dịch vụ'}
            description={
              isCreate
                ? 'Tạo gói dịch vụ mới với giá, thời lượng và cấu hình vận hành.'
                : `Chỉnh sửa ${pkg?.name}`
            }
            action={
              <Link to="/admin/services/packages">
                <Button variant="secondary">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </Button>
              </Link>
            }
          />

          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle className="text-base">Thông tin gói dịch vụ</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminServicePackageForm
                mode={isCreate ? 'create' : 'edit'}
                initialPackage={pkg}
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
