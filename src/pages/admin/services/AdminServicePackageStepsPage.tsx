import { ArrowLeft, ListOrdered, Package } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminStepsTemplateEditor } from '../../../components/admin/servicePackage/AdminStepsTemplateEditor'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminServicePackage,
  useUpdateAdminServicePackageSteps,
} from '../../../hooks/api/admin/useAdminServicePackages'
import { adminQueryKeys } from '../../../hooks/api/admin/queryKeys'
import { useQueryClient } from '@tanstack/react-query'
import type { ServiceStepTemplate } from '../../../types/servicePackage'

function getPackageSlug(packageId: string, packageName: string) {
  const fromId = packageId.replace(/^pkg-/, '')
  if (fromId) return fromId

  return packageName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function AdminServicePackageStepsPage() {
  const { packageId } = useParams<{ packageId: string }>()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const packageQuery = useAdminServicePackage(packageId)
  const updateStepsMutation = useUpdateAdminServicePackageSteps()

  // Always refetch the latest steps_template when entering this page so we
  // don't render a stale (empty) steps array from a previously-cached fetch.
  useEffect(() => {
    if (!packageId) return
    void queryClient.invalidateQueries({ queryKey: adminQueryKeys.servicePackage(packageId) })
  }, [packageId, queryClient])

  const pkg = packageQuery.data
  const isSubmitting = updateStepsMutation.isPending

  if (!packageQuery.isLoading && (packageQuery.isError || !pkg)) {
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

  const handleSave = async (steps: ServiceStepTemplate[]) => {
    if (!packageId) return

    updateStepsMutation.mutate(
      { packageId, steps },
      {
        onSuccess: (updated) => {
          showToast(
            `Đã cập nhật ${updated.steps_template.length} bước cho ${updated.name}.`,
            'success',
          )
        },
        onError: (error) => {
          showToast(
            getApiErrorMessage(error, 'Không thể cập nhật mẫu các bước.'),
            'error',
          )
        },
      },
    )
  }

  return (
    <div>
      {packageQuery.isLoading || !pkg ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Quản trị"
            title="Trình soạn các bước"
            description={`Chỉnh sửa quy trình thực hiện cho gói ${pkg.name}`}
            action={
              <div className="flex flex-wrap gap-2">
                <Link to={`/admin/services/packages/${pkg.id}/edit`}>
                  <Button variant="secondary">Sửa thông tin gói</Button>
                </Link>
                <Link to="/admin/services/packages">
                  <Button variant="secondary">
                    <ArrowLeft className="h-4 w-4" />
                    Danh sách gói
                  </Button>
                </Link>
              </div>
            }
          />

          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListOrdered className="h-4 w-4 text-brand-600" />
                {pkg.steps_template.length} bước — {pkg.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdminStepsTemplateEditor
                key={pkg.id}
                packageSlug={getPackageSlug(pkg.id, pkg.name)}
                initialSteps={pkg.steps_template}
                onSave={handleSave}
                isSubmitting={isSubmitting}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
