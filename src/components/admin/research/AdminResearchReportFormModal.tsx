import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  adminResearchReportFormSchema,
  type AdminResearchReportFormValues,
} from '../../../lib/validations/adminResearchReport'
import type { ApiResearchReport } from '../../../types/api/admin'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import { Select } from '../../ui/Select'
import { useAdminSurveys } from '../../../hooks/api/admin/useAdminSurveys'

interface AdminResearchReportFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  initialReport?: ApiResearchReport
  onClose: () => void
  onSubmit: (values: AdminResearchReportFormValues) => Promise<void>
  isSubmitting?: boolean
}

export function AdminResearchReportFormModal({
  open,
  mode,
  initialReport,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AdminResearchReportFormModalProps) {
  const { data: surveysData } = useAdminSurveys({ limit: 100 })
  const surveys = surveysData?.surveys ?? []

  const form = useForm<AdminResearchReportFormValues>({
    resolver: zodResolver(adminResearchReportFormSchema),
    defaultValues: {
      title: '',
      objective: '',
      type: 'SURVEY_INSIGHT',
      filters: {
        survey_id: '',
        from: '',
        to: '',
        garage_id: '',
        service_package_id: '',
        vehicle_type: null,
        group_by: 'DAY',
      },
    },
  })

  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      form.reset({
        title: '',
        objective: '',
        type: 'SURVEY_INSIGHT',
        filters: {
          survey_id: surveys[0]?.id ?? '',
          from: '',
          to: '',
          garage_id: '',
          service_package_id: '',
          vehicle_type: null,
          group_by: 'DAY',
        },
      })
      return
    }

    if (initialReport) {
      const filters = (initialReport.filters ?? {}) as Partial<
        AdminResearchReportFormValues['filters']
      >
      form.reset({
        title: initialReport.title,
        objective: initialReport.objective ?? '',
        type: 'SURVEY_INSIGHT',
        filters: {
          survey_id: filters.survey_id ?? '',
          from: filters.from ?? '',
          to: filters.to ?? '',
          garage_id: filters.garage_id ?? '',
          service_package_id: filters.service_package_id ?? '',
          vehicle_type: filters.vehicle_type ?? null,
          group_by: filters.group_by ?? 'DAY',
        },
      })
    }
  }, [open, mode, initialReport, form, surveys])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Tạo báo cáo nghiên cứu' : 'Sửa báo cáo nghiên cứu'}
      description={
        mode === 'create'
          ? 'Tạo báo cáo AI phân tích khảo sát khách hàng.'
          : 'Cập nhật thông tin báo cáo nghiên cứu.'
      }
      className="max-w-2xl"
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <div>
          <Label htmlFor="title" required>
            Tiêu đề
          </Label>
          <Input
            id="title"
            placeholder="Phân tích khảo sát Q2/2026"
            error={form.formState.errors.title?.message}
            {...form.register('title')}
          />
        </div>
        <div>
          <Label htmlFor="objective" required>
            Mục tiêu
          </Label>
          <Input
            id="objective"
            placeholder="Tìm hiểu điểm hài lòng theo garage"
            error={form.formState.errors.objective?.message}
            {...form.register('objective')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="survey_id" required>
              Khảo sát nguồn
            </Label>
            <Select
              id="survey_id"
              error={form.formState.errors.filters?.survey_id?.message}
              {...form.register('filters.survey_id')}
            >
              <option value="">Chọn khảo sát</option>
              {surveys.map((survey) => (
                <option key={survey.id} value={survey.id}>
                  {survey.title}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="group_by">Gom nhóm</Label>
            <Select id="group_by" {...form.register('filters.group_by')}>
              <option value="DAY">Theo ngày</option>
              <option value="WEEK">Theo tuần</option>
              <option value="MONTH">Theo tháng</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="from">Từ ngày</Label>
            <Input id="from" type="date" {...form.register('filters.from')} />
          </div>
          <div>
            <Label htmlFor="to">Đến ngày</Label>
            <Input id="to" type="date" {...form.register('filters.to')} />
          </div>
          <div>
            <Label htmlFor="vehicle_type">Loại xe</Label>
            <Select
              id="vehicle_type"
              {...form.register('filters.vehicle_type')}
            >
              <option value="">Tất cả</option>
              <option value="CAR">Ô tô</option>
              <option value="MOTORBIKE">Xe máy</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="garage_id">Garage</Label>
            <Input
              id="garage_id"
              placeholder="Mã garage (tùy chọn)"
              {...form.register('filters.garage_id')}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : mode === 'create' ? (
              'Tạo báo cáo'
            ) : (
              'Lưu thay đổi'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}