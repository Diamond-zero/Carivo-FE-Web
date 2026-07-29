import { ArrowLeft, Gift } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminPromotionForm } from '../../../components/admin/promotion/AdminPromotionForm'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminPromotion,
  useCreateAdminPromotion,
  useUpdateAdminPromotion,
} from '../../../hooks/api/admin/useAdminPromotions'
import type { PromotionCreatePayload, PromotionUpdatePayload } from '../../../api/promotion.api'
import type { AdminPromotionFormValues } from '../../../lib/validations/adminPromotion'

export function AdminPromotionFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { promotionId } = useParams<{ promotionId: string }>()
  const { showToast } = useToast()

  const isCreate = location.pathname.endsWith('/new')
  const promotionQuery = useAdminPromotion(!isCreate ? promotionId : undefined)
  const createMutation = useCreateAdminPromotion()
  const updateMutation = useUpdateAdminPromotion()

  const promotion = promotionQuery.data
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isLoading = !isCreate && promotionQuery.isLoading

  if (!isCreate && !isLoading && (promotionQuery.isError || !promotion)) {
    return (
      <div>
        <PageHeader
          title="Không tìm thấy khuyến mãi"
          description="Mã khuyến mãi không tồn tại trong hệ thống."
          action={
            <Link to="/admin/promotions">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách
              </Button>
            </Link>
          }
        />
        <EmptyState
          icon={Gift}
          title="Khuyến mãi không tồn tại"
          description={getApiErrorMessage(
            promotionQuery.error,
            'Mã không khớp với dữ liệu hệ thống.',
          )}
          action={
            <Link to="/admin/promotions">
              <Button>Về danh sách khuyến mãi</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const handleSubmit = async (values: AdminPromotionFormValues) => {
    const base: PromotionCreatePayload = {
      code: values.code,
      name: values.name,
      description: values.description?.trim() || null,
      discount_type: values.discount_type,
      discount_value: values.discount_value,
      min_order_amount: values.min_order_amount,
      audience: values.audience,
      phone_required: values.phone_required,
      applicable_tiers: values.applicable_tiers,
      is_active: values.is_active,
      start_at: values.start_at,
      end_at: values.end_at,
    }

    if (values.discount_type === 'PERCENTAGE' && values.max_discount_amount != null) {
      Object.assign(base, { max_discount_amount: values.max_discount_amount })
    }

    if (values.usage_limit != null && values.usage_limit > 0) {
      Object.assign(base, { usage_limit: values.usage_limit })
    }

    if (values.per_customer_limit != null && values.per_customer_limit > 0) {
      Object.assign(base, { per_customer_limit: values.per_customer_limit })
    }

    if (values.phone_required && values.per_phone_limit != null) {
      Object.assign(base, { per_phone_limit: values.per_phone_limit })
    }

    if (values.applicable_vehicle_types.length > 0) {
      Object.assign(base, { applicable_vehicle_types: values.applicable_vehicle_types })
    }

    if (values.applicable_service_package_ids.length > 0) {
      Object.assign(base, { applicable_service_package_ids: values.applicable_service_package_ids })
    }

    if (isCreate) {
      createMutation.mutate(base, {
        onSuccess: (created) => {
          showToast(`Đã tạo mã ${created.code}.`, 'success')
          navigate('/admin/promotions')
        },
        onError: (error) => {
          showToast(getApiErrorMessage(error, 'Không thể tạo khuyến mãi.'), 'error')
        },
      })
      return
    }

    if (!promotionId) return

    updateMutation.mutate(
      { promotionId, payload: base as PromotionUpdatePayload },
      {
        onSuccess: (updated) => {
          showToast(`Đã cập nhật ${updated.code}.`, 'success')
          navigate('/admin/promotions')
        },
        onError: (error) => {
          showToast(getApiErrorMessage(error, 'Không thể cập nhật khuyến mãi.'), 'error')
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
            title={isCreate ? 'Thêm khuyến mãi' : 'Sửa khuyến mãi'}
            description={
              isCreate
                ? 'Tạo mã giảm giá mới với điều kiện áp dụng và thời gian hiệu lực.'
                : `Chỉnh sửa ${promotion?.code}`
            }
            action={
              <Link to="/admin/promotions">
                <Button variant="secondary">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </Button>
              </Link>
            }
          />

          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle className="text-base">Thông tin khuyến mãi</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminPromotionForm
                mode={isCreate ? 'create' : 'edit'}
                initialPromotion={promotion}
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
