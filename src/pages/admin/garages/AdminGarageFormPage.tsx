import { ArrowLeft, Building2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AdminGarageForm } from '../../../components/admin/garage/AdminGarageForm'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import { useInitialPageSkeleton } from '../../../hooks/useInitialPageSkeleton'
import type { AdminGarageFormValues } from '../../../lib/validations/adminGarage'
import {
  createAdminGarage,
  getAdminGarageById,
  updateAdminGarage,
} from '../../../mocks/admin/adminGarageStore'

export function AdminGarageFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { garageId } = useParams<{ garageId: string }>()
  const { showToast } = useToast()
  const isLoading = useInitialPageSkeleton(240)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isCreate = location.pathname.endsWith('/new')
  const garage = !isCreate && garageId ? getAdminGarageById(garageId) : undefined

  if (!isLoading && !isCreate && !garage) {
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
          description="Mã garage không khớp với dữ liệu mock Admin."
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
    setIsSubmitting(true)

    try {
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
        const result = createAdminGarage(payload)
        if (!result.ok) {
          showToast(result.message, 'error')
          return
        }

        showToast(`Đã tạo garage ${result.garage.name}.`, 'success')
        navigate('/admin/garages')
        return
      }

      if (!garageId) return

      const result = updateAdminGarage(garageId, payload)
      if (!result.ok) {
        showToast(result.message, 'error')
        return
      }

      showToast(`Đã cập nhật ${result.garage.name}.`, 'success')
      navigate('/admin/garages')
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
