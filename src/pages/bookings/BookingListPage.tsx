import { Plus, SearchX } from 'lucide-react'

import { useState } from 'react'

import { Link } from 'react-router-dom'

import { BookingListFilters } from '../../components/booking/BookingListFilters'

import { BookingTable } from '../../components/booking/BookingTable'

import { MarkPaidModal } from '../../components/booking/MarkPaidModal'

import { PageHeader } from '../../components/layout/PageHeader'

import { Button } from '../../components/ui/Button'

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'

import { EmptyState } from '../../components/ui/EmptyState'

import { PageHeaderSkeleton, TableRowsSkeleton } from '../../components/ui/Skeleton'

import { useAuth } from '../../contexts/AuthContext'

import { useBookings } from '../../contexts/BookingContext'

import { useToast } from '../../contexts/ToastContext'

import { getApiErrorMessage } from '../../api/client'

import { useStaffBookingList } from '../../hooks/api/staff/useStaffBookingList'

import type { Booking } from '../../types/booking'

import {

  DEFAULT_BOOKING_FILTERS,

  type BookingFilters,

} from '../../utils/bookingFilters'



export function BookingListPage() {

  const { session } = useAuth()

  const { markBookingPaid, createPayosPayment } = useBookings()

  const { showToast } = useToast()

  const [filters, setFilters] = useState<BookingFilters>(DEFAULT_BOOKING_FILTERS)

  const [markPaidBooking, setMarkPaidBooking] = useState<Booking | null>(null)



  const {

    data,

    isLoading,

    isFetching,

    isError,

    error,

    refetch,

  } = useStaffBookingList(filters)



  const bookings = data?.bookings ?? []

  const total = data?.meta?.total ?? bookings.length



  const handleMarkPaid = async () => {

    if (!markPaidBooking) {

      return { success: false, message: 'Không xác định được booking.' }

    }



    const result = await markBookingPaid(markPaidBooking.id)

    if (result.success) {

      showToast(result.message, 'success')

      void refetch()

    }

    return result

  }

  const handlePayos = async () => {
    if (!markPaidBooking) {
      return { success: false, message: 'Không xác định được booking.' }
    }

    const result = await createPayosPayment(markPaidBooking.id)
    if (result.success) {
      showToast(result.message, 'success')
      void refetch()
    }
    return {
      success: result.success,
      message: result.message,
      checkoutUrl: result.checkoutUrl,
    }
  }

  return (

    <div>

      {isLoading ? (

        <>

          <PageHeaderSkeleton />

          <div className="mb-6 h-36 animate-pulse rounded-2xl bg-slate-200/60" />

          <TableRowsSkeleton rows={6} columns={7} />

        </>

      ) : (

        <>

      <PageHeader

        title="Danh sách booking"

        description="Lấy dữ liệu từ GET /admin/bookings — lọc theo trạng thái, ngày, biển số hoặc SĐT."

        action={

          <Link to="/bookings/walk-in">

            <Button>

              <Plus className="h-4 w-4" />

              Đặt lịch 

            </Button>

          </Link>

        }

      />



      <div className="mb-6">

        <BookingListFilters

          filters={filters}

          onChange={setFilters}

          onReset={() => setFilters(DEFAULT_BOOKING_FILTERS)}

        />

      </div>



      {isError ? (

        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          {getApiErrorMessage(error, 'Không thể tải danh sách booking.')}

        </div>

      ) : null}



      <Card>

        <CardHeader className="flex flex-row items-center justify-between gap-4">

          <CardTitle>

            {total} booking

            {filters.status !== 'ALL' ||

            filters.date ||

            filters.licensePlate ||

            filters.phone

              ? ' (đã lọc)'

              : ''}

            {isFetching && !isLoading ? ' · đang cập nhật...' : ''}

          </CardTitle>

        </CardHeader>

        <CardContent className="p-0 pb-2">

          {bookings.length === 0 ? (

            <EmptyState

              icon={SearchX}

              title="Không tìm thấy booking"

              description="Thử đổi bộ lọc hoặc xóa điều kiện tìm kiếm."

              action={

                <Button

                  variant="secondary"

                  size="sm"

                  onClick={() => setFilters(DEFAULT_BOOKING_FILTERS)}

                >

                  Xóa bộ lọc

                </Button>

              }

              compact

            />

          ) : (

            <BookingTable

              bookings={bookings}

              staffGarageId={session?.staffProfile.garage_id}

              onMarkPaid={setMarkPaidBooking}

            />

          )}

        </CardContent>

      </Card>



      {markPaidBooking ? (

        <MarkPaidModal

          open={Boolean(markPaidBooking)}

          onClose={() => setMarkPaidBooking(null)}

          booking={markPaidBooking}

          onConfirmCash={handleMarkPaid}

          onConfirmPayos={handlePayos}

        />

      ) : null}

        </>

      )}

    </div>

  )

}


