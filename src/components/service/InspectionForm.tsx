import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  INSPECTION_TYPE_DESCRIPTIONS,
  INSPECTION_TYPE_LABELS,
} from '../../constants/inspection'
import {
  inspectionSchema,
  type InspectionFormValues,
} from '../../lib/validations/inspection'
import type { Booking } from '../../types/booking'
import type { VehicleInspection } from '../../types/inspection'
import { getBookingCustomerName } from '../../utils/booking'
import { Button } from '../ui/Button'
import { Label } from '../ui/Label'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'

interface ImagePreview {
  id: string
  file: File
  url: string
}

interface InspectionFormProps {
  bookings: Booking[]
  existingInspections: VehicleInspection[]
  defaultBookingId?: string
  onBookingChange?: (bookingId: string) => void
  onSubmit: (
    data: InspectionFormValues,
    imageUrls: string[],
  ) => Promise<void>
  isSubmitting?: boolean
}

export function InspectionForm({
  bookings,
  existingInspections,
  defaultBookingId,
  onBookingChange,
  onSubmit,
  isSubmitting = false,
}: InspectionFormProps) {
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([])
  const [imageError, setImageError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      booking_id: defaultBookingId ?? '',
      type: 'BEFORE_WASH',
      note: '',
    },
  })

  const selectedBookingId = watch('booking_id')
  const selectedType = watch('type')

  useEffect(() => {
    if (defaultBookingId) {
      setValue('booking_id', defaultBookingId)
    }
  }, [defaultBookingId, setValue])

  useEffect(() => {
    if (selectedBookingId) {
      onBookingChange?.(selectedBookingId)
    }
  }, [selectedBookingId, onBookingChange])

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [imagePreviews])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    setImageError(null)

    const validFiles = files.filter((file) => file.type.startsWith('image/'))
    if (validFiles.length !== files.length) {
      setImageError('Chỉ chấp nhận file ảnh.')
    }

    const newPreviews = validFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      file,
      url: URL.createObjectURL(file),
    }))

    setImagePreviews((current) => [...current, ...newPreviews])
    event.target.value = ''
  }

  const removeImage = (id: string) => {
    setImagePreviews((current) => {
      const target = current.find((item) => item.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return current.filter((item) => item.id !== id)
    })
  }

  const handleFormSubmit = async (data: InspectionFormValues) => {
    if (imagePreviews.length === 0) {
      setImageError('Vui lòng upload ít nhất 1 ảnh kiểm tra.')
      return
    }

    setImageError(null)
    await onSubmit(
      data,
      imagePreviews.map((preview) => preview.url),
    )

    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
    setImagePreviews([])
    reset({
      booking_id: data.booking_id,
      type: 'BEFORE_WASH',
      note: '',
    })
  }

  const bookingInspections = existingInspections.filter(
    (item) => item.booking_id === selectedBookingId,
  )

  const hasBeforeWash = bookingInspections.some(
    (item) => item.type === 'BEFORE_WASH',
  )

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div>
        <Label htmlFor="booking_id" required>
          Booking
        </Label>
        <Select
          id="booking_id"
          error={errors.booking_id?.message}
          {...register('booking_id')}
        >
          <option value="">Chọn booking</option>
          {bookings.map((booking) => (
            <option key={booking.id} value={booking.id}>
              {booking.id.replace('booking-', '#')} · {booking.license_plate} ·{' '}
              {getBookingCustomerName(booking)}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="type" required>
          Loại kiểm tra
        </Label>
        <Select id="type" {...register('type')}>
          <option value="BEFORE_WASH">
            {INSPECTION_TYPE_LABELS.BEFORE_WASH}
          </option>
          <option value="AFTER_WASH">
            {INSPECTION_TYPE_LABELS.AFTER_WASH}
          </option>
        </Select>
        <p className="mt-1.5 text-xs text-slate-500">
          {INSPECTION_TYPE_DESCRIPTIONS[selectedType]}
        </p>
        {selectedType === 'BEFORE_WASH' && hasBeforeWash ? (
          <p className="mt-1.5 text-xs text-amber-600">
            Booking này đã có biên bản BEFORE_WASH — vẫn có thể tạo thêm (mock).
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="note" required>
          Ghi chú kiểm tra
        </Label>
        <Textarea
          id="note"
          placeholder="Mô tả tình trạng xe, vết xước, hư hỏng..."
          error={errors.note?.message}
          {...register('note')}
        />
      </div>

      <div>
        <Label required>Ảnh kiểm tra</Label>
        <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 transition-colors hover:border-brand-300 hover:bg-brand-50/40">
          <ImagePlus className="h-8 w-8 text-slate-400" />
          <span className="mt-2 text-sm font-medium text-slate-700">
            Chọn ảnh từ thiết bị
          </span>
          <span className="mt-1 text-xs text-slate-500">
            JPG, PNG, WEBP — preview local (mock upload)
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageChange}
          />
        </label>
        {imageError ? (
          <p className="mt-1.5 text-sm text-red-600">{imageError}</p>
        ) : null}

        {imagePreviews.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {imagePreviews.map((preview) => (
              <div
                key={preview.id}
                className="group relative overflow-hidden rounded-xl border border-slate-200"
              >
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  className="aspect-[4/3] w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(preview.id)}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Xóa ảnh"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="truncate px-2 py-1 text-xs text-slate-500">
                  {preview.file.name}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang lưu biên bản...
          </>
        ) : (
          'Lưu biên bản kiểm tra'
        )}
      </Button>
    </form>
  )
}
