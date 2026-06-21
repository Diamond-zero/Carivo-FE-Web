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
    const payload = {
      code: values.code,
      name: values.name,
      description: values.description,
      discount_type: values.discount_type,
      discount_value: values.discount_value,
      max_discount_amount:
        values.discount_type === 'PERCENTAGE' ? values.max_discount_amount ?? null : null,
      min_order_amount: values.min_order_amount,
      applicable_tiers: values.applicable_tiers,
      usage_limit: values.usage_limit ?? null,
      start_at: values.start_at,
      end_at: values.end_at,
      is_active: values.is_active,
    }

    if (isCreate) {
      createMutation.mutate(payload, {
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
      { promotionId, payload },
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
