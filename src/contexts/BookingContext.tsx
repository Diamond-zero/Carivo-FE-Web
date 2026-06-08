import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { mockBookings } from '../mocks/bookings'
import type { Booking } from '../types/booking'
import { getBookingPhone, normalizeSearchText } from '../utils/booking'

interface BookingContextValue {
  bookings: Booking[]
  getBookingById: (id: string) => Booking | undefined
  searchCheckInCandidates: (query: string) => Booking[]
  checkInBooking: (id: string) => { success: boolean; message: string }
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

  const value = useMemo(
    () => ({
      bookings,
      getBookingById,
      searchCheckInCandidates,
      checkInBooking,
    }),
    [bookings, getBookingById, searchCheckInCandidates, checkInBooking],
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
