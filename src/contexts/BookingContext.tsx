import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { mockBookings } from '../mocks/bookings'
import type { Booking, WalkInBookingForm } from '../types/booking'
import { getBookingPhone, normalizeSearchText } from '../utils/booking'
import { buildWalkInBooking } from '../utils/walkIn'

interface BookingContextValue {
  bookings: Booking[]
  getBookingById: (id: string) => Booking | undefined
  searchCheckInCandidates: (query: string) => Booking[]
  checkInBooking: (id: string) => { success: boolean; message: string }
  createWalkInBooking: (
    garageId: string,
    data: WalkInBookingForm,
  ) => { success: boolean; message: string; bookingId?: string }
}

const BookingContext = createContext<BookingContextValue | null>(null)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(() =>
    mockBookings.map((booking) => ({ ...booking })),
  )

  const getBookingById = useCallback(
    (id: string) => bookings.find((booking) => booking.id === id),
    [bookings],
  )

  const searchCheckInCandidates = useCallback(
    (query: string) => {
      const normalizedQuery = normalizeSearchText(query.trim())
      if (!normalizedQuery) return []

      return bookings.filter((booking) => {
        if (booking.status !== 'CONFIRMED') return false

        const plate = normalizeSearchText(booking.license_plate)
        const phone = normalizeSearchText(getBookingPhone(booking))

        return (
          plate.includes(normalizedQuery) || phone.includes(normalizedQuery)
        )
      })
    },
    [bookings],
  )

  const checkInBooking = useCallback((id: string) => {
    const booking = bookings.find((item) => item.id === id)

    if (!booking) {
      return { success: false, message: 'Không tìm thấy booking.' }
    }

    if (booking.status !== 'CONFIRMED') {
      return {
        success: false,
        message: 'Chỉ booking ở trạng thái Đã xác nhận mới được check-in.',
      }
    }

    setBookings((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: 'CHECKED_IN' } : item,
      ),
    )

    return {
      success: true,
      message: `Check-in thành công cho booking ${id.replace('booking-', '#')}.`,
    }
  }, [bookings])

  const createWalkInBooking = useCallback(
    (garageId: string, data: WalkInBookingForm) => {
      const newBooking = buildWalkInBooking(garageId, data)

      setBookings((current) => [newBooking, ...current])

      return {
        success: true,
        message: `Tạo walk-in ${newBooking.id.replace('booking-', '#')} thành công.`,
        bookingId: newBooking.id,
      }
    },
    [bookings],
  )

  const value = useMemo(
    () => ({
      bookings,
      getBookingById,
      searchCheckInCandidates,
      checkInBooking,
      createWalkInBooking,
    }),
    [
      bookings,
      getBookingById,
      searchCheckInCandidates,
      checkInBooking,
      createWalkInBooking,
    ],
  )

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  )
}

export function useBookings() {
  const context = useContext(BookingContext)
  if (!context) {
    throw new Error('useBookings must be used within BookingProvider')
  }
  return context
}
