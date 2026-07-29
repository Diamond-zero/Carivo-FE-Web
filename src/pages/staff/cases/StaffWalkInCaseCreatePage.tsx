import { ArrowLeft, CheckCircle2, Loader2, Upload } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { uploadFileApi } from '../../../api/upload.api'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Select } from '../../../components/ui/Select'
import { useToast } from '../../../contexts/ToastContext'
import {
  CASE_CATEGORY_OPTIONS,
  useCreateWalkInCustomerCaseMutation,
} from '../../../hooks/api/staff/useStaffCustomerCases'
import type { CustomerCaseCategory } from '../../../types/api/customerCase'

const EVIDENCE_REQUIRED_CATEGORIES: CustomerCaseCategory[] = [
  'VEHICLE_DAMAGE',
  'MISSING_PROPERTY',
  'SAFETY_CONCERN',
]

export function StaffWalkInCaseCreatePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const createMutation = useCreateWalkInCustomerCaseMutation()

  const [bookingId, setBookingId] = useState('')
  const [category, setCategory] =
    useState<CustomerCaseCategory>('SERVICE_QUALITY')
  const [description, setDescription] = useState('')
  const [damageLocation, setDamageLocation] = useState('')
  const [desiredResolution, setDesiredResolution] = useState('')
  const [vehicleReceived, setVehicleReceived] = useState(false)
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const requiresEvidence = EVIDENCE_REQUIRED_CATEGORIES.includes(category)
  const isSubmitting = isUploading || createMutation.isPending

  const handleCreate = async () => {
    if (!bookingId.trim()) {
      showToast('Vui lòng nhập mã booking walk-in.', 'error')
      return
    }
    if (description.trim().length < 10) {
      showToast('Mô tả hồ sơ phải có ít nhất 10 ký tự.', 'error')
      return
    }
    if (category === 'VEHICLE_DAMAGE' && !damageLocation.trim()) {
      showToast('Vui lòng nhập vị trí hư hỏng trên xe.', 'error')
      return
    }
    if (requiresEvidence && evidenceFiles.length === 0) {
      showToast(
        'Phân loại này bắt buộc có ít nhất một ảnh bằng chứng.',
        'error',
      )
      return
    }

    setIsUploading(true)
    try {
      const uploads = await Promise.all(
        evidenceFiles.map((file) =>
          uploadFileApi(file, {
            purpose: 'CUSTOMER_CASE_EVIDENCE',
          }),
        ),
      )
      const created = await createMutation.mutateAsync({
        booking_id: bookingId.trim(),
        category,
        description: description.trim(),
        damage_location:
          category === 'VEHICLE_DAMAGE' ? damageLocation.trim() : undefined,
        desired_resolution: desiredResolution.trim() || undefined,
        vehicle_received: vehicleReceived,
        upload_ids: uploads.map((upload) => upload.id),
      })
      showToast('Đã tạo hồ sơ khiếu nại cho khách walk-in.', 'success')
      navigate(`/staff/cases/${created.case.id}`)
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể tạo hồ sơ.'), 'error')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/staff/cases"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
      </div>

      <PageHeader
        eyebrow="Carivo Staff"
        title="Tạo hồ sơ walk-in"
        description="Tạo trực tiếp hồ sơ khiếu nại từ booking walk-in. Hệ thống sẽ kiểm tra booking thuộc garage hiện tại."
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Thông tin hồ sơ khiếu nại</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="walkin-booking" required>
              Mã booking walk-in
            </Label>
            <Input
              id="walkin-booking"
              placeholder="Nhập ID booking"
              value={bookingId}
              onChange={(event) => setBookingId(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="case-category" required>
              Phân loại
            </Label>
            <Select
              id="case-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as CustomerCaseCategory)
              }
              disabled={isSubmitting}
            >
              {CASE_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="case-description" required>
              Mô tả chi tiết
            </Label>
            <textarea
              id="case-description"
              rows={5}
              maxLength={2000}
              className="min-h-[120px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
              placeholder="Mô tả sự việc, thời điểm phát hiện và tình trạng hiện tại..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-slate-500">
              Tối thiểu 10 ký tự, tối đa 2.000 ký tự.
            </p>
          </div>

          {category === 'VEHICLE_DAMAGE' ? (
            <div>
              <Label htmlFor="damage-location" required>
                Vị trí hư hỏng
              </Label>
              <Input
                id="damage-location"
                maxLength={500}
                placeholder="Ví dụ: cản trước bên phải"
                value={damageLocation}
                onChange={(event) => setDamageLocation(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          ) : null}

          <div>
            <Label htmlFor="desired-resolution">
              Mong muốn xử lý của khách
            </Label>
            <textarea
              id="desired-resolution"
              rows={3}
              maxLength={1000}
              className="min-h-[80px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
              placeholder="Ghi nhận mong muốn của khách nếu có..."
              value={desiredResolution}
              onChange={(event) => setDesiredResolution(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="case-evidence" required={requiresEvidence}>
              Ảnh bằng chứng
            </Label>
            <Input
              id="case-evidence"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) =>
                setEvidenceFiles(
                  Array.from(event.target.files ?? []).slice(0, 10),
                )
              }
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-slate-500">
              Tối đa 10 ảnh
              {requiresEvidence ? '; phân loại hiện tại bắt buộc có ảnh.' : '.'}
            </p>
            {evidenceFiles.length > 0 ? (
              <p className="mt-1 text-xs font-medium text-slate-700">
                Đã chọn {evidenceFiles.length} ảnh.
              </p>
            ) : null}
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600"
              checked={vehicleReceived}
              onChange={(event) => setVehicleReceived(event.target.checked)}
              disabled={isSubmitting}
            />
            <span>
              <span className="block text-sm font-medium text-slate-800">
                Garage đang tiếp nhận xe
              </span>
              <span className="block text-xs text-slate-500">
                Chỉ chọn khi xe vẫn đang được garage giữ để kiểm tra hoặc xử lý.
              </span>
            </span>
          </label>

          <Button onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : evidenceFiles.length > 0 ? (
              <Upload className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {isUploading ? 'Đang tải ảnh...' : 'Tạo hồ sơ'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
