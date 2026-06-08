import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { WalkInForm } from '../../components/booking/WalkInForm'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { useAuth } from '../../contexts/AuthContext'
import { useBookings } from '../../contexts/BookingContext'
import type { WalkInBookingForm } from '../../types/booking'

export function WalkInCreatePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { createWalkInBooking } = useBookings()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null)

  const handleCreate = async (data: WalkInBookingForm) => {
    if (!session?.garage.id) {
      setError('Không xác định được garage.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setCreatedBookingId(null)

    await new Promise((resolve) => setTimeout(resolve, 600))

    const result = createWalkInBooking(session.garage.id, data)
    setIsSubmitting(false)

    if (!result.success || !result.bookingId) {
      setError(result.message)
      return
    }

    setCreatedBookingId(result.bookingId)
  }

  return (
    <div>
      <PageHeader
        title="Walk-in mới"
        description="Tạo booking cho khách vãng lai tại garage — tự động check-in sau khi tạo."
        action={
          <Link to="/bookings">
            <Button variant="secondary">Danh sách booking</Button>
          </Link>
        }
      />

      {createdBookingId ? (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Tạo walk-in thành công!
                </p>
                <p className="mt-1 text-sm text-green-700">
                  Booking{' '}
                  <strong>
                    {createdBookingId.replace('booking-', '#')}
                  </strong>{' '}
                  — trạng thái Đã check-in
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setCreatedBookingId(null)
                }}
              >
                Tạo thêm
              </Button>
              <Button onClick={() => navigate(`/bookings/${createdBookingId}`)}>
                Xem chi tiết
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Thông tin khách walk-in</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          {!createdBookingId ? (
            <WalkInForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
          ) : (
            <p className="text-sm text-slate-500">
              Bấm &quot;Tạo thêm&quot; để nhập booking walk-in mới.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
