import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { mockBookings } from '../mocks/bookings'
import { mockInspections } from '../mocks/inspections'
import { mockServiceSteps } from '../mocks/serviceSteps'
import { mockWashBays } from '../mocks/washBays'
import { mockWashHistories } from '../mocks/washHistories'
import type { Booking, WalkInBookingForm } from '../types/booking'
import type { VehicleInspection } from '../types/inspection'
import type { BookingServiceStep } from '../types/serviceStep'
import type { WashBay } from '../types/washBay'
import type { WashHistory } from '../types/washHistory'
import { getBookingPhone, normalizeSearchText } from '../utils/booking'
import {
  buildInspection,
  type CreateInspectionInput,
} from '../utils/inspection'
import {
  areAllStepsDone,
  canCompleteStep,
  createDefaultStepsForBooking,
} from '../utils/serviceSteps'
import { buildWalkInBooking } from '../utils/walkIn'
import {
  bookingRequiresWashBay,
  getSelectableWashBays,
} from '../utils/washBay'
import {
  buildWashHistory,
  calculateEarnedPoints,
  canMarkBookingPaid,
} from '../utils/payment'

interface BookingContextValue {
  bookings: Booking[]
  inspections: VehicleInspection[]
  washBays: WashBay[]
  getBookingById: (id: string) => Booking | undefined
  getWashBayById: (id: string) => WashBay | undefined
  getAvailableWashBaysForBooking: (bookingId: string) => WashBay[]
  assignWashBay: (
    bookingId: string,
    washBayId: string,
  ) => { success: boolean; message: string }
  searchCheckInCandidates: (query: string) => Booking[]
  checkInBooking: (id: string) => { success: boolean; message: string }
  createWalkInBooking: (
    garageId: string,
    data: WalkInBookingForm,
  ) => { success: boolean; message: string; bookingId?: string }
  getServiceStepsByBookingId: (bookingId: string) => BookingServiceStep[]
  startService: (bookingId: string) => { success: boolean; message: string }
  completeServiceStep: (
    stepId: string,
    staffProfileId: string,
  ) => { success: boolean; message: string }
  completeService: (bookingId: string) => { success: boolean; message: string }
  markBookingPaid: (
    bookingId: string,
  ) => {
    success: boolean
    message: string
    earnedPoints?: number
    washHistoryId?: string
  }
  washHistories: WashHistory[]
  getInspectionsByBookingId: (bookingId: string) => VehicleInspection[]
  createInspection: (
    data: CreateInspectionInput,
    staffProfileId: string,
  ) => { success: boolean; message: string; inspectionId?: string }
}

const BookingContext = createContext<BookingContextValue | null>(null)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(() =>
    mockBookings.map((booking) => ({ ...booking })),
  )
  const [serviceSteps, setServiceSteps] = useState<BookingServiceStep[]>(() =>
    mockServiceSteps.map((step) => ({ ...step })),
  )
  const [inspections, setInspections] = useState<VehicleInspection[]>(() =>
    mockInspections.map((inspection) => ({ ...inspection })),
  )
  const [washBays, setWashBays] = useState<WashBay[]>(() =>
    mockWashBays.map((bay) => ({ ...bay })),
  )
  const [washHistories, setWashHistories] = useState<WashHistory[]>(() =>
    mockWashHistories.map((item) => ({ ...item })),
  )

  const getBookingById = useCallback(
    (id: string) => bookings.find((booking) => booking.id === id),
    [bookings],
  )

  const getServiceStepsByBookingId = useCallback(
    (bookingId: string) =>
      serviceSteps
        .filter((step) => step.booking_id === bookingId)
        .sort((a, b) => a.order - b.order),
    [serviceSteps],
  )

  const getInspectionsByBookingId = useCallback(
    (bookingId: string) =>
      inspections
        .filter((inspection) => inspection.booking_id === bookingId)
        .sort(
          (a, b) =>
            new Date(b.inspected_at).getTime() -
            new Date(a.inspected_at).getTime(),
        ),
    [inspections],
  )

  const getWashBayById = useCallback(
    (id: string) => washBays.find((bay) => bay.id === id),
    [washBays],
  )

  const getAvailableWashBaysForBooking = useCallback(
    (bookingId: string) => {
      const booking = bookings.find((item) => item.id === bookingId)
      if (!booking) return []
      return getSelectableWashBays(washBays, booking)
    },
    [bookings, washBays],
  )

  const assignWashBay = useCallback(
    (bookingId: string, washBayId: string) => {
      const booking = bookings.find((item) => item.id === bookingId)
      const bay = washBays.find((item) => item.id === washBayId)

      if (!booking) {
        return { success: false, message: 'Không tìm thấy booking.' }
      }

      if (!bay) {
        return { success: false, message: 'Không tìm thấy buồng rửa.' }
      }

      if (booking.status !== 'IN_PROGRESS') {
        return {
          success: false,
          message: 'Chỉ booking IN_PROGRESS mới được gán buồng rửa.',
        }
      }

      if (booking.wash_bay_id) {
        return {
          success: false,
          message: 'Booking đã được gán buồng rửa.',
        }
      }

      if (!bookingRequiresWashBay(booking)) {
        return {
          success: false,
          message: 'Gói dịch vụ này không yêu cầu buồng rửa.',
        }
      }

      if (
        bay.garage_id !== booking.garage_id ||
        bay.vehicle_type !== booking.vehicle_type ||
        !bay.is_active ||
        bay.status !== 'AVAILABLE'
      ) {
        return {
          success: false,
          message: 'Buồng rửa không khả dụng hoặc không phù hợp loại xe.',
        }
      }

      setBookings((current) =>
        current.map((item) =>
          item.id === bookingId ? { ...item, wash_bay_id: washBayId } : item,
        ),
      )

      setWashBays((current) =>
        current.map((item) =>
          item.id === washBayId
            ? {
                ...item,
                status: 'OCCUPIED',
                current_booking_id: bookingId,
              }
            : item,
        ),
      )

      return {
        success: true,
        message: `Đã gán ${bay.name} cho booking ${bookingId.replace('booking-', '#')}.`,
      }
    },
    [bookings, washBays],
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

  const startService = useCallback(
    (bookingId: string) => {
      const booking = bookings.find((item) => item.id === bookingId)

      if (!booking) {
        return { success: false, message: 'Không tìm thấy booking.' }
      }

      if (booking.status !== 'CHECKED_IN') {
        return {
          success: false,
          message: 'Chỉ booking đã check-in mới được bắt đầu dịch vụ.',
        }
      }

      const existingSteps = serviceSteps.filter(
        (step) => step.booking_id === bookingId,
      )

      if (existingSteps.length === 0) {
        const newSteps = createDefaultStepsForBooking(booking)
        setServiceSteps((current) => [...current, ...newSteps])
      }

      setBookings((current) =>
        current.map((item) =>
          item.id === bookingId ? { ...item, status: 'IN_PROGRESS' } : item,
        ),
      )

      return {
        success: true,
        message: 'Đã bắt đầu dịch vụ và tạo các bước thực hiện.',
      }
    },
    [bookings, serviceSteps],
  )

  const completeServiceStep = useCallback(
    (stepId: string, staffProfileId: string) => {
      const step = serviceSteps.find((item) => item.id === stepId)

      if (!step) {
        return { success: false, message: 'Không tìm thấy bước dịch vụ.' }
      }

      const bookingSteps = serviceSteps
        .filter((item) => item.booking_id === step.booking_id)
        .sort((a, b) => a.order - b.order)

      if (!canCompleteStep(step, bookingSteps)) {
        return {
          success: false,
          message: 'Hoàn thành các bước trước đó trước khi tiếp tục.',
        }
      }

      const now = new Date().toISOString().slice(0, 19)
      const nextPending = bookingSteps.find(
        (item) => item.order === step.order + 1 && item.status === 'PENDING',
      )

      setServiceSteps((current) =>
        current.map((item) => {
          if (item.id === stepId) {
            return {
              ...item,
              status: 'DONE',
              confirmed_by_staff_id: staffProfileId,
              completed_at: now,
            }
          }

          if (nextPending && item.id === nextPending.id) {
            return {
              ...item,
              status: 'IN_PROGRESS',
              started_at: now,
            }
          }

          return item
        }),
      )

      return { success: true, message: `Đã hoàn thành bước "${step.step_name}".` }
    },
    [serviceSteps],
  )

  const completeService = useCallback(
    (bookingId: string) => {
      const booking = bookings.find((item) => item.id === bookingId)

      if (!booking) {
        return { success: false, message: 'Không tìm thấy booking.' }
      }

      if (booking.status !== 'IN_PROGRESS') {
        return {
          success: false,
          message: 'Chỉ booking đang thực hiện mới hoàn thành được.',
        }
      }

      const bookingSteps = serviceSteps.filter(
        (step) => step.booking_id === bookingId,
      )

      if (!areAllStepsDone(bookingSteps)) {
        return {
          success: false,
          message: 'Cần hoàn thành tất cả các bước trước khi kết thúc dịch vụ.',
        }
      }

      if (bookingRequiresWashBay(booking) && !booking.wash_bay_id) {
        return {
          success: false,
          message: 'Cần gán buồng rửa trước khi hoàn thành dịch vụ.',
        }
      }

      setBookings((current) =>
        current.map((item) =>
          item.id === bookingId ? { ...item, status: 'COMPLETED' } : item,
        ),
      )

      if (booking.wash_bay_id) {
        setWashBays((current) =>
          current.map((item) =>
            item.id === booking.wash_bay_id
              ? {
                  ...item,
                  status: 'AVAILABLE',
                  current_booking_id: null,
                }
              : item,
          ),
        )
      }

      return {
        success: true,
        message: 'Đã hoàn thành dịch vụ. Khách có thể thanh toán tại quầy.',
      }
    },
    [bookings, serviceSteps],
  )

  const markBookingPaid = useCallback(
    (bookingId: string) => {
      const booking = bookings.find((item) => item.id === bookingId)

      if (!booking) {
        return { success: false, message: 'Không tìm thấy booking.' }
      }

      if (!canMarkBookingPaid(booking)) {
        return {
          success: false,
          message: 'Chỉ booking COMPLETED và chưa thanh toán mới được thu tiền.',
        }
      }

      const earnedPoints = calculateEarnedPoints(booking)
      const washHistory = buildWashHistory(booking)

      setBookings((current) =>
        current.map((item) =>
          item.id === bookingId
            ? { ...item, payment_status: 'PAID' }
            : item,
        ),
      )

      setWashHistories((current) => [washHistory, ...current])

      const pointsMessage =
        earnedPoints > 0
          ? ` Đã cộng ${earnedPoints} điểm loyalty (mock).`
          : ''

      return {
        success: true,
        message: `Xác nhận thanh toán ${booking.id.replace('booking-', '#')} thành công.${pointsMessage}`,
        earnedPoints,
        washHistoryId: washHistory.id,
      }
    },
    [bookings],
  )

  const createInspection = useCallback(
    (data: CreateInspectionInput, staffProfileId: string) => {
      const booking = bookings.find((item) => item.id === data.booking_id)

      if (!booking) {
        return { success: false, message: 'Không tìm thấy booking.' }
      }

      if (!['CHECKED_IN', 'IN_PROGRESS'].includes(booking.status)) {
        return {
          success: false,
          message:
            'Chỉ booking CHECKED_IN hoặc IN_PROGRESS mới tạo được biên bản.',
        }
      }

      if (data.images.length === 0) {
        return { success: false, message: 'Cần ít nhất 1 ảnh kiểm tra.' }
      }

      const newInspection = buildInspection(data, staffProfileId)
      setInspections((current) => [newInspection, ...current])

      return {
        success: true,
        message: `Đã lưu biên bản ${newInspection.type === 'BEFORE_WASH' ? 'trước rửa' : 'sau rửa'}.`,
        inspectionId: newInspection.id,
      }
    },
    [bookings],
  )

  const value = useMemo(
    () => ({
      bookings,
      inspections,
      washBays,
      getBookingById,
      getWashBayById,
      getAvailableWashBaysForBooking,
      assignWashBay,
      searchCheckInCandidates,
      checkInBooking,
      createWalkInBooking,
      getServiceStepsByBookingId,
      startService,
      completeServiceStep,
      completeService,
      markBookingPaid,
      washHistories,
      getInspectionsByBookingId,
      createInspection,
    }),
    [
      bookings,
      inspections,
      washBays,
      getBookingById,
      getWashBayById,
      getAvailableWashBaysForBooking,
      assignWashBay,
      searchCheckInCandidates,
      checkInBooking,
      createWalkInBooking,
      getServiceStepsByBookingId,
      startService,
      completeServiceStep,
      completeService,
      markBookingPaid,
      washHistories,
      getInspectionsByBookingId,
      createInspection,
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
