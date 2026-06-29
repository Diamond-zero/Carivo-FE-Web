import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Camera, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { InspectionForm } from '../../components/service/InspectionForm'
import { InspectionHistoryList } from '../../components/service/InspectionHistoryList'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { useAuth } from '../../contexts/AuthContext'
import { useBookings } from '../../contexts/BookingContext'
import type { InspectionFormValues } from '../../lib/validations/inspection'
import { getCreateInspectionGuard } from '../../utils/bookingActionGuards'

export function InspectionPage() {
  const { session } = useAuth()
  const {
    bookings,
    inspections,
    getInspectionsByBookingId,
    fetchInspections,
    createInspection,
  } = useBookings()

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string>('')

  const inspectableBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          getCreateInspectionGuard(
            booking,
            session?.staffProfile.garage_id,
          ).allowed,
      ),
    [bookings, session?.staffProfile.garage_id],
  )

  const defaultBookingId =
    selectedBookingId || inspectableBookings[0]?.id || undefined

  const historyInspections = defaultBookingId
    ? getInspectionsByBookingId(defaultBookingId)
    : []

  useEffect(() => {
    if (defaultBookingId) {
      void fetchInspections(defaultBookingId)
    }
  }, [defaultBookingId, fetchInspections])

  const handleSubmit = async (
    data: InspectionFormValues,
    imageUrls: string[],
  ) => {
    if (!session?.staffProfile.id) {
      setFeedback({ type: 'error', message: 'Không xác định được nhân viên.' })
      return
    }

    setIsSubmitting(true)
    setFeedback(null)

    const result = await createInspection(
      {
        booking_id: data.booking_id,
        type: data.type,
        note: data.note,
        images: imageUrls,
      },
      session.staffProfile.id,
    )

    setIsSubmitting(false)
    setSelectedBookingId(data.booking_id)
    setFeedback({
      type: result.success ? 'success' : 'error',
      message: result.message,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/bookings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
        <span className="text-xs text-slate-500">
          {inspectableBookings.length} booking khả dụng
        </span>
      </div>

      <PageHeader
        title="Kiểm tra xe"
        description="Tạo biên bản trước khi rửa / sau khi rửa và upload ảnh minh chứng."
      />

      {feedback ? (
        <div
          className={`mb-6 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : null}
          <span>{feedback.message}</span>
        </div>
      ) : null}

      {inspectableBookings.length === 0 ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent>
            <EmptyState
              icon={Camera}
              title="Không có booking để kiểm tra"
              description="Chỉ booking CHECKED_IN hoặc IN_PROGRESS mới tạo được biên bản."
              action={
                <Link to="/bookings">
                  <Button variant="secondary">Xem danh sách booking</Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Biên bản mới</CardTitle>
              <CardDescription>
                Chọn booking và loại kiểm tra, thêm ghi chú + ảnh
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InspectionForm
                bookings={inspectableBookings}
                existingInspections={inspections}
                defaultBookingId={defaultBookingId}
                onBookingChange={setSelectedBookingId}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Lịch sử kiểm tra</CardTitle>
              <CardDescription>
                {defaultBookingId
                  ? `Booking #${defaultBookingId.slice(-6)}`
                  : 'Chọn booking để xem lịch sử'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InspectionHistoryList inspections={historyInspections} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
