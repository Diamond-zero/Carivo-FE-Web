import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { InspectionForm } from '../../components/service/InspectionForm'
import { InspectionHistoryList } from '../../components/service/InspectionHistoryList'
import { Button } from '../../components/ui/Button'
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
  const { bookings, inspections, getInspectionsByBookingId, createInspection } =
    useBookings()

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
    await new Promise((resolve) => setTimeout(resolve, 500))

    const result = createInspection(
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
    <div>
      <div className="mb-4">
        <Link
          to="/bookings"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
      </div>

      <PageHeader
        title="Kiểm tra xe"
        description="Tạo biên bản BEFORE_WASH / AFTER_WASH và upload ảnh minh chứng (mock)."
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
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-500">
              Không có booking CHECKED_IN hoặc IN_PROGRESS để kiểm tra.
            </p>
            <Link to="/bookings" className="mt-4 inline-block">
              <Button variant="secondary">Xem danh sách booking</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
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

          <Card>
            <CardHeader>
              <CardTitle>Lịch sử kiểm tra</CardTitle>
              <CardDescription>
                {defaultBookingId
                  ? `Booking ${defaultBookingId.replace('booking-', '#')}`
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
