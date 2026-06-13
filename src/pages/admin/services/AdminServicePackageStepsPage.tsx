import { ArrowLeft, ListOrdered, Package } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminStepsTemplateEditor } from '../../../components/admin/servicePackage/AdminStepsTemplateEditor'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import { useInitialPageSkeleton } from '../../../hooks/useInitialPageSkeleton'
import {
  getAdminServicePackageById,
  updateAdminServicePackageSteps,
} from '../../../mocks/admin/adminServicePackageStore'
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
  const isLoading = useInitialPageSkeleton(240)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const pkg = useMemo(
    () => (packageId ? getAdminServicePackageById(packageId) : undefined),
    [packageId, refreshKey],
  )

  if (!isLoading && !pkg) {
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
          description="Mã gói không khớp với dữ liệu mock Admin."
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

    setIsSubmitting(true)
    try {
      const result = updateAdminServicePackageSteps(packageId, steps)
      if (!result.ok) {
        showToast(result.message, 'error')
        return
      }

      setRefreshKey((value) => value + 1)
      showToast(`Đã cập nhật ${result.package.steps_template.length} bước cho ${result.package.name}.`, 'success')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {isLoading || !pkg ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Admin"
            title="Steps Template Editor"
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
                key={`${pkg.id}-${refreshKey}`}
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
