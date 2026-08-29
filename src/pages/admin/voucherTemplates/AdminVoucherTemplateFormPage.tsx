import { ArrowLeft, Coins } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminVoucherTemplateForm } from '../../../components/admin/voucherTemplate/AdminVoucherTemplateForm'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminVoucherTemplate,
  useCreateAdminVoucherTemplate,
  useUpdateAdminVoucherTemplate,
} from '../../../hooks/api/admin/useAdminVoucherTemplates'
import type {
  VoucherTemplateCreatePayload,
  VoucherTemplateUpdatePayload,
} from '../../../api/voucherTemplate.api'
import type { AdminVoucherTemplateFormValues } from '../../../lib/validations/adminVoucherTemplate'

export function AdminVoucherTemplateFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { voucherTemplateId } = useParams<{ voucherTemplateId: string }>()
  const { showToast } = useToast()

  const isCreate = location.pathname.endsWith('/new')
  const voucherTemplateQuery = useAdminVoucherTemplate(!isCreate ? voucherTemplateId : undefined)
  const createMutation = useCreateAdminVoucherTemplate()
  const updateMutation = useUpdateAdminVoucherTemplate()

  const voucherTemplate = voucherTemplateQuery.data
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isLoading = !isCreate && voucherTemplateQuery.isLoading

  if (!isCreate && !isLoading && (voucherTemplateQuery.isError || !voucherTemplate)) {
    return (
      <div>
        <PageHeader
          title="Không tìm thấy voucher đổi điểm"
          description="Voucher không tồn tại trong hệ thống."
          action={
            <Link to="/admin/voucher-templates">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách
              </Button>
            </Link>
          }
        />
        <EmptyState
          icon={Coins}
          title="Voucher không tồn tại"
          description={getApiErrorMessage(
            voucherTemplateQuery.error,
            'Mã không khớp với dữ liệu hệ thống.',
          )}
          action={
            <Link to="/admin/voucher-templates">
              <Button>Về danh sách voucher đổi điểm</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const handleSubmit = async (values: AdminVoucherTemplateFormValues) => {
    const base: VoucherTemplateCreatePayload = {
      name: values.name,
      description: values.description?.trim() || null,
      voucher_type: values.voucher_type,
      value: values.voucher_type === 'FREE_SERVICE' ? 0 : values.value,
      max_discount_amount:
        values.voucher_type === 'PERCENTAGE' ? (values.max_discount_amount ?? null) : null,
      min_order_amount: values.min_order_amount,
      service_package_id:
        values.voucher_type === 'FREE_SERVICE' ? values.service_package_id : null,
      points_cost: values.points_cost,
      voucher_validity_days: values.voucher_validity_days,
      total_quantity: values.total_quantity ?? null,
      per_customer_limit: values.per_customer_limit ?? null,
      applicable_tiers: values.applicable_tiers,
      is_active: values.is_active,
      start_at: values.start_at,
      end_at: values.end_at,
    }

    if (isCreate) {
      try {
        const created = await createMutation.mutateAsync(base)
        showToast(`Đã tạo voucher ${created.name}.`, 'success')
        navigate('/admin/voucher-templates')
      } catch (error) {
        showToast(getApiErrorMessage(error, 'Không thể tạo voucher đổi điểm.'), 'error')
      }
      return
    }

    if (!voucherTemplateId) return

    try {
      const updated = await updateMutation.mutateAsync({
        voucherTemplateId,
        payload: base as VoucherTemplateUpdatePayload,
      })
      showToast(`Đã cập nhật ${updated.name}.`, 'success')
      navigate('/admin/voucher-templates')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể cập nhật voucher đổi điểm.'), 'error')
    }
  }

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Quản trị"
            title={isCreate ? 'Thêm voucher đổi điểm' : 'Sửa voucher đổi điểm'}
            description={
              isCreate
                ? 'Tạo voucher mới để khách hàng dùng điểm tích lũy đổi lấy.'
                : `Chỉnh sửa ${voucherTemplate?.name}`
            }
            action={
              <Link to="/admin/voucher-templates">
                <Button variant="secondary">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </Button>
              </Link>
            }
          />

          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle className="text-base">Thông tin voucher</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminVoucherTemplateForm
                mode={isCreate ? 'create' : 'edit'}
                initialVoucherTemplate={voucherTemplate}
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
