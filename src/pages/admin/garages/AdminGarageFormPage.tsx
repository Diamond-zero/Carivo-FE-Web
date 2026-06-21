import { ArrowLeft, Building2 } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminGarageForm } from '../../../components/admin/garage/AdminGarageForm'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminGarage,
  useCreateAdminGarage,
  useUpdateAdminGarage,
} from '../../../hooks/api/admin/useAdminGarages'
import type { AdminGarageFormValues } from '../../../lib/validations/adminGarage'

export function AdminGarageFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { garageId } = useParams<{ garageId: string }>()
  const { showToast } = useToast()

  const isCreate = location.pathname.endsWith('/new')
  const garageQuery = useAdminGarage(!isCreate ? garageId : undefined)
  const createMutation = useCreateAdminGarage()
  const updateMutation = useUpdateAdminGarage()

  const garage = garageQuery.data
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isLoading = !isCreate && garageQuery.isLoading

  if (!isCreate && !isLoading && (garageQuery.isError || !garage)) {
    return (
      <div>
        <PageHeader
          title="Không tìm thấy garage"
          description="Garage không tồn tại trong hệ thống."
          action={
            <Link to="/admin/garages">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách
              </Button>
            </Link>
          }
        />
        <EmptyState
          icon={Building2}
          title="Garage không tồn tại"
          description={getApiErrorMessage(
            garageQuery.error,
            'Mã garage không khớp với dữ liệu hệ thống.',
          )}
          action={
            <Link to="/admin/garages">
              <Button>Về danh sách garage</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const handleSubmit = async (values: AdminGarageFormValues) => {
    const payload = {
      name: values.name,
      garage_code: values.garage_code,
      address: values.address,
      city: values.city,
      phone: values.phone,
      opening_time: values.opening_time,
      closing_time: values.closing_time,
      slot_interval_minutes: values.slot_interval_minutes,
      is_active: values.is_active,
    }

    if (isCreate) {
      createMutation.mutate(payload, {
        onSuccess: (created) => {
          showToast(`Đã tạo garage ${created.name}.`, 'success')
          navigate('/admin/garages')
        },
        onError: (error) => {
          showToast(getApiErrorMessage(error, 'Không thể tạo garage.'), 'error')
        },
      })
      return
    }

    if (!garageId) return

    updateMutation.mutate(
      { garageId, payload },
      {
        onSuccess: (updated) => {
          showToast(`Đã cập nhật ${updated.name}.`, 'success')
          navigate('/admin/garages')
        },
        onError: (error) => {
          showToast(getApiErrorMessage(error, 'Không thể cập nhật garage.'), 'error')
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
            title={isCreate ? 'Thêm garage' : 'Sửa garage'}
            description={
              isCreate
                ? 'Tạo chi nhánh mới với mã garage, địa chỉ và khung giờ vận hành.'
                : `Chỉnh sửa ${garage?.name} — ${garage?.garage_code}`
            }
            action={
              <Link to="/admin/garages">
                <Button variant="secondary">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </Button>
              </Link>
            }
          />

          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle className="text-base">Thông tin garage</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminGarageForm
                mode={isCreate ? 'create' : 'edit'}
                initialGarage={garage}
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
