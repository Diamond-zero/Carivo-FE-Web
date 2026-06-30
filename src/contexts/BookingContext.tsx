import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  assignWashBayApi,
  cancelBookingApi,
  checkInBookingApi,
  completeServiceApi,
  completeServiceStepApi,
  createBookingInspectionApi,
  createWalkInBookingApi,
  getBookingInspectionsApi,
  getBookingServiceStepsApi,
  getLateArrivalOptionsApi,
  getStaffBookingsApi,
  markBookingNoShowApi,
  resolveLateArrivalApi,
  startServiceApi,
} from '../api/booking.api'
import { getServicePackagesApi } from '../api/servicePackage.api'
import {
  createPayosPaymentApi,
  markBookingPaidWithCashApi,
} from '../api/payment.api'
import { getAvailableWashBaysApi } from '../api/washBay.api'
import { getWashHistoriesApi } from '../api/washHistory.api'
import { getApiErrorMessage } from '../api/client'
import { useAuth } from './AuthContext'
import {
  deriveWashBaysFromBookings,
  mapApiBooking,
  mapApiInspection,
  mapApiServicePackage,
  mapApiServiceStep,
  mapApiWashBay,
} from '../lib/mappers/staffMappers'
import type {
  ApiBooking,
  CancelBookingApiPayload,
  MarkNoShowApiPayload,
  ResolveLateArrivalApiPayload,
} from '../types/api/staff'
import type { Booking, WalkInBookingForm } from '../types/booking'
import type { VehicleInspection } from '../types/inspection'
import type { ServicePackage } from '../types/servicePackage'
import type { BookingServiceStep } from '../types/serviceStep'
import type { WashBay } from '../types/washBay'
import type { WashHistory } from '../types/washHistory'
import { getBookingPhone, normalizeSearchText } from '../utils/booking'
import type { CreateInspectionInput } from '../utils/inspection'
import { getSelectableWashBays } from '../utils/washBay'
import { buildWalkInBookingPayload, getStaffGarageId } from '../utils/walkIn'
import { staffQueryKeys } from '../hooks/api/staff/queryKeys'
import { mapWashHistoriesWithBookingFallback } from '../utils/washHistoryEnrichment'

export interface ActionResult {
  success: boolean
  message: string
  bookingId?: string
  earnedPoints?: number
  washHistoryId?: string
  inspectionId?: string
  checkoutUrl?: string
  paymentId?: string
  /** BE báo khách đến muộn — cần resolve late arrival trước khi status được set CHECKED_IN */
  lateResolutionRequired?: boolean
  lateMinutes?: number
}

interface BookingContextValue {
  isLoading: boolean
  isMutating: boolean
  bookings: Booking[]
  servicePackages: ServicePackage[]
  inspections: VehicleInspection[]
  washBays: WashBay[]
  washHistories: WashHistory[]
  isLoadingWashHistories: boolean
  isWashHistoriesError: boolean
  washHistoriesError: string | null
  refetchWashHistories: () => Promise<void>
  getBookingById: (id: string) => Booking | undefined
  getWashBayById: (id: string) => WashBay | undefined
  getAvailableWashBaysForBooking: (bookingId: string) => WashBay[]
  fetchAvailableWashBaysForBooking: (bookingId: string) => Promise<WashBay[]>
  getServicePackageName: (id: string, fallback?: string) => string
  getServicePackagesByVehicleType: (
    vehicleType: Booking['vehicle_type'],
  ) => ServicePackage[]
  assignWashBay: (bookingId: string, washBayId: string) => Promise<ActionResult>
  searchCheckInCandidates: (query: string) => Booking[]
  checkInBooking: (id: string) => Promise<ActionResult>
  createWalkInBooking: (data: WalkInBookingForm) => Promise<ActionResult>
  cancelBooking: (
    id: string,
    payload?: CancelBookingApiPayload,
  ) => Promise<ActionResult>
  markBookingNoShow: (
    id: string,
    payload?: MarkNoShowApiPayload,
  ) => Promise<ActionResult>
  getLateArrivalOptions: (bookingId: string, days?: number) => Promise<
    import('../types/api/staff').ApiLateArrivalOptions
  >
  resolveLateArrival: (
    bookingId: string,
    payload: ResolveLateArrivalApiPayload,
  ) => Promise<ActionResult>
  getServiceStepsByBookingId: (bookingId: string) => BookingServiceStep[]
  fetchServiceSteps: (bookingId: string) => Promise<BookingServiceStep[]>
  startService: (
    bookingId: string,
    note?: string,
  ) => Promise<ActionResult>
  completeServiceStep: (
    stepId: string,
    staffProfileId: string,
  ) => Promise<ActionResult>
  completeService: (bookingId: string) => Promise<ActionResult>
  markBookingPaid: (bookingId: string) => Promise<ActionResult>
  createPayosPayment: (
    bookingId: string,
  ) => Promise<ActionResult & { checkoutUrl?: string; paymentId?: string }>
  getInspectionsByBookingId: (bookingId: string) => VehicleInspection[]
  fetchInspections: (bookingId: string) => Promise<VehicleInspection[]>
  createInspection: (
    data: CreateInspectionInput,
    staffProfileId: string,
  ) => Promise<ActionResult>
  refreshBookings: () => Promise<void>
}

const BookingContext = createContext<BookingContextValue | null>(null)

export function BookingProvider({ children }: { children: ReactNode }) {
  const { session, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const garageId = session?.staffProfile.garage_id

  const [stepsByBooking, setStepsByBooking] = useState<
    Record<string, BookingServiceStep[]>
  >({})
  const [inspectionsByBooking, setInspectionsByBooking] = useState<
    Record<string, VehicleInspection[]>
  >({})
  const [availableBaysByBooking, setAvailableBaysByBooking] = useState<
    Record<string, WashBay[]>
  >({})

  // Staff không có quyền GET /admin/garages/:id/wash-bays — suy buồng rửa từ bookings.
  const washBaysQuery = useQuery({
    queryKey: staffQueryKeys.washBays(garageId),
    queryFn: async () => [] as WashBay[],
    enabled: false,
  })

  const bookingsQuery = useQuery({
    queryKey: staffQueryKeys.bookings(garageId),
    queryFn: async () => {
      const result = await getStaffBookingsApi({
        limit: 100,
        garage_id: garageId,
      })
      return {
        raw: result.bookings,
        mapped: result.bookings.map(mapApiBooking),
      }
    },
    enabled: isAuthenticated && Boolean(garageId),
  })

  const servicePackagesQuery = useQuery({
    queryKey: staffQueryKeys.servicePackages,
    queryFn: async () => {
      const packages = await getServicePackagesApi()
      return packages.map(mapApiServicePackage)
    },
    enabled: isAuthenticated,
  })

  const washHistoriesQuery = useQuery({
    queryKey: staffQueryKeys.washHistories(garageId),
    queryFn: async () => {
      // STAFF: BE tự giới hạn theo StaffProfile.garage_id — không gửi garage_id
      const result = await getWashHistoriesApi({ limit: 100 })
      const cachedBookings =
        queryClient.getQueryData<{ raw: ApiBooking[] }>(
          staffQueryKeys.bookings(garageId),
        )?.raw ?? []
      return mapWashHistoriesWithBookingFallback(result.histories, cachedBookings)
    },
    enabled: isAuthenticated && Boolean(garageId),
    staleTime: 30_000,
  })

  const bookings = bookingsQuery.data?.mapped ?? []
  const rawBookings: ApiBooking[] = bookingsQuery.data?.raw ?? []
  const servicePackages = servicePackagesQuery.data ?? []
  const washHistories = washHistoriesQuery.data ?? []

  const washBays = useMemo(() => {
    if (!garageId) return []

    const apiBays = washBaysQuery.data ?? []
    const baseBays =
      apiBays.length > 0
        ? apiBays
        : deriveWashBaysFromBookings(rawBookings, garageId)

    const bayMap = new Map(baseBays.map((bay) => [bay.id, { ...bay }]))

    for (const booking of rawBookings) {
      if (booking.status !== 'IN_PROGRESS' || !booking.wash_bay_id) continue
      const bay = bayMap.get(booking.wash_bay_id)
      if (bay) {
        bay.status = 'OCCUPIED'
        bay.current_booking_id = booking.id
      }
    }

    return Array.from(bayMap.values())
  }, [garageId, washBaysQuery.data, rawBookings])

  const invalidateBookings = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: staffQueryKeys.bookings(garageId),
    })
    await queryClient.invalidateQueries({
      queryKey: staffQueryKeys.washHistories(garageId),
    })
    await queryClient.invalidateQueries({
      queryKey: staffQueryKeys.washBays(garageId),
    })
  }, [garageId, queryClient])

  const refetchWashHistories = useCallback(async () => {
    await washHistoriesQuery.refetch()
  }, [washHistoriesQuery])

  const getBookingById = useCallback(
    (id: string) => bookings.find((booking) => booking.id === id),
    [bookings],
  )

  const getWashBayById = useCallback(
    (id: string) => washBays.find((bay) => bay.id === id),
    [washBays],
  )

  const getAvailableWashBaysForBooking = useCallback(
    (bookingId: string) => availableBaysByBooking[bookingId] ?? [],
    [availableBaysByBooking],
  )

  const fetchAvailableWashBaysForBooking = useCallback(
    async (bookingId: string) => {
      const booking = bookings.find((item) => item.id === bookingId)
      if (!booking || !garageId) return []

      try {
        const bays = await getAvailableWashBaysApi(garageId, booking.vehicle_type)
        const mapped = bays.map((bay) => mapApiWashBay(bay, garageId))
        setAvailableBaysByBooking((current) => ({
          ...current,
          [bookingId]: mapped,
        }))
        return mapped
      } catch {
        const fallback = getSelectableWashBays(washBays, booking)
        setAvailableBaysByBooking((current) => ({
          ...current,
          [bookingId]: fallback,
        }))
        return fallback
      }
    },
    [bookings, garageId, washBays],
  )

  const getServicePackageNameFn = useCallback(
    (id: string, fallback?: string) => {
      return (
        servicePackages.find((pkg) => pkg.id === id)?.name ??
        bookings.find((b) => b.service_package_id === id)?.service_package_name ??
        fallback ??
        'Gói dịch vụ'
      )
    },
    [servicePackages, bookings],
  )

  const getServicePackagesByVehicleTypeFn = useCallback(
    (vehicleType: Booking['vehicle_type']) =>
      servicePackages.filter(
        (pkg) => pkg.vehicle_type === vehicleType && pkg.is_active,
      ),
    [servicePackages],
  )

  const fetchServiceSteps = useCallback(async (bookingId: string) => {
    const steps = (await getBookingServiceStepsApi(bookingId)).map(
      mapApiServiceStep,
    )
    setStepsByBooking((current) => ({ ...current, [bookingId]: steps }))
    return steps
  }, [])

  const getServiceStepsByBookingId = useCallback(
    (bookingId: string) => stepsByBooking[bookingId] ?? [],
    [stepsByBooking],
  )

  const fetchInspections = useCallback(async (bookingId: string) => {
    const items = (await getBookingInspectionsApi(bookingId)).map(mapApiInspection)
    setInspectionsByBooking((current) => ({ ...current, [bookingId]: items }))
    return items
  }, [])

  const getInspectionsByBookingId = useCallback(
    (bookingId: string) => inspectionsByBooking[bookingId] ?? [],
    [inspectionsByBooking],
  )

  const allInspections = useMemo(
    () => Object.values(inspectionsByBooking).flat(),
    [inspectionsByBooking],
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

  const checkInMutation = useMutation({
    mutationFn: (id: string) => checkInBookingApi(id),
    onSuccess: () => void invalidateBookings(),
  })

  const walkInMutation = useMutation({
    mutationFn: ({
      garageId,
      data,
    }: {
      garageId: string
      data: WalkInBookingForm
    }) =>
      createWalkInBookingApi(buildWalkInBookingPayload(garageId, data)),
    onSuccess: () => void invalidateBookings(),
  })

  const assignBayMutation = useMutation({
    mutationFn: ({
      bookingId,
      washBayId,
    }: {
      bookingId: string
      washBayId: string
    }) => assignWashBayApi(bookingId, washBayId),
    onSuccess: (_, { bookingId }) => {
      void invalidateBookings()
      void fetchServiceSteps(bookingId)
    },
  })

  const startServiceMutation = useMutation({
    mutationFn: ({
      bookingId,
      note,
    }: {
      bookingId: string
      note?: string
    }) =>
      startServiceApi(bookingId, {
        ...(note ? { note } : {}),
      }),
    onSuccess: async (_, { bookingId }) => {
      await invalidateBookings()
      await fetchServiceSteps(bookingId)
    },
  })

  const completeStepMutation = useMutation({
    mutationFn: ({
      bookingId,
      stepId,
    }: {
      bookingId: string
      stepId: string
    }) => completeServiceStepApi(bookingId, stepId),
    onSuccess: async (_, { bookingId }) => {
      await fetchServiceSteps(bookingId)
    },
  })

  const completeServiceMutation = useMutation({
    mutationFn: (bookingId: string) => completeServiceApi(bookingId),
    onSuccess: () => void invalidateBookings(),
  })

  const markPaidMutation = useMutation({
    mutationFn: (bookingId: string) => markBookingPaidWithCashApi(bookingId),
    onSuccess: () => void invalidateBookings(),
  })

  const payosMutation = useMutation({
    mutationFn: (bookingId: string) =>
      createPayosPaymentApi(bookingId, {
        return_url: `${window.location.origin}/bookings/${bookingId}`,
        cancel_url: `${window.location.origin}/bookings/${bookingId}`,
      }),
    onSuccess: () => void invalidateBookings(),
  })

  const cancelBookingMutation = useMutation({
    mutationFn: ({
      bookingId,
      payload,
    }: {
      bookingId: string
      payload?: CancelBookingApiPayload
    }) => cancelBookingApi(bookingId, payload),
    onSuccess: () => void invalidateBookings(),
  })

  const markNoShowMutation = useMutation({
    mutationFn: ({
      bookingId,
      payload,
    }: {
      bookingId: string
      payload?: MarkNoShowApiPayload
    }) => markBookingNoShowApi(bookingId, payload),
    onSuccess: () => void invalidateBookings(),
  })

  const resolveLateArrivalMutation = useMutation({
    mutationFn: ({
      bookingId,
      payload,
    }: {
      bookingId: string
      payload: ResolveLateArrivalApiPayload
    }) => resolveLateArrivalApi(bookingId, payload),
    onSuccess: () => void invalidateBookings(),
  })

  const createInspectionMutation = useMutation({
    mutationFn: ({
      bookingId,
      payload,
    }: {
      bookingId: string
      payload: CreateInspectionInput
    }) =>
      createBookingInspectionApi(bookingId, {
        type: payload.type,
        note: payload.note,
        images: payload.images,
      }),
    onSuccess: async (_, { bookingId }) => {
      await fetchInspections(bookingId)
    },
  })

  const wrapMutation = async <T,>(
    fn: () => Promise<T>,
    successMessage: string,
    mapResult?: (data: T) => Partial<ActionResult>,
  ): Promise<ActionResult> => {
    try {
      const data = await fn()
      return {
        success: true,
        message: successMessage,
        ...mapResult?.(data),
      }
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, 'Thao tác thất bại. Vui lòng thử lại.'),
      }
    }
  }

  const findBookingIdByStepId = useCallback(
    (stepId: string) => {
      for (const [bookingId, steps] of Object.entries(stepsByBooking)) {
        if (steps.some((step) => step.id === stepId)) {
          return bookingId
        }
      }
      return undefined
    },
    [stepsByBooking],
  )

  const checkInBooking = useCallback(
    (id: string) =>
      wrapMutation(
        () => checkInMutation.mutateAsync(id),
        'Check-in thành công.',
        (booking) => {
          // BE chỉ set status=CHECKED_IN khi khách đến ON_TIME/EARLY. Khi LATE, status
          // vẫn là CONFIRMED và phải gọi resolveLateArrival trước. Nếu hiển thị
          // "thành công" thì user tưởng xong nhưng reload sẽ thấy vẫn CONFIRMED.
          if (booking.late_resolution_required) {
            return {
              success: false,
              message:
                booking.late_minutes && booking.late_minutes > 0
                  ? `Khách đến muộn ${booking.late_minutes} phút. Vui lòng xử lý đến trễ trước khi check-in hoàn tất.`
                  : 'Khách đến muộn ngoài khung giờ cho phép. Vui lòng xử lý đến trễ trước khi check-in hoàn tất.',
              bookingId: booking.id,
              lateResolutionRequired: true,
              lateMinutes: booking.late_minutes ?? 0,
            }
          }
          return {
            success: true,
            message: 'Check-in thành công.',
            bookingId: booking.id,
          }
        },
      ),
    [checkInMutation],
  )

  const createWalkInBooking = useCallback(
    (data: WalkInBookingForm) => {
      const resolvedGarageId = getStaffGarageId(session)
      if (!resolvedGarageId) {
        return Promise.resolve({
          success: false,
          message: 'Không xác định được garage. Vui lòng đăng nhập lại.',
        })
      }

      return wrapMutation(
        async () =>
          walkInMutation.mutateAsync({ garageId: resolvedGarageId, data }),
        data.serve_now
          ? 'Tạo walk-in và check-in thành công.'
          : 'Tạo walk-in thành công.',
        (booking) => ({ bookingId: mapApiBooking(booking).id }),
      )
    },
    [walkInMutation, session],
  )

  const cancelBooking = useCallback(
    (id: string, payload?: CancelBookingApiPayload) =>
      wrapMutation(
        () => cancelBookingMutation.mutateAsync({ bookingId: id, payload }),
        'Đã hủy booking.',
      ),
    [cancelBookingMutation],
  )

  const markBookingNoShow = useCallback(
    (id: string, payload?: MarkNoShowApiPayload) =>
      wrapMutation(
        () => markNoShowMutation.mutateAsync({ bookingId: id, payload }),
        'Đã đánh dấu no-show.',
      ),
    [markNoShowMutation],
  )

  const getLateArrivalOptions = useCallback(
    (bookingId: string, days = 1) => getLateArrivalOptionsApi(bookingId, days),
    [],
  )

  const resolveLateArrival = useCallback(
    (bookingId: string, payload: ResolveLateArrivalApiPayload) =>
      wrapMutation(
        () =>
          resolveLateArrivalMutation.mutateAsync({ bookingId, payload }),
        'Đã xử lý khách đến trễ.',
      ),
    [resolveLateArrivalMutation],
  )

  const assignWashBay = useCallback(
    (bookingId: string, washBayId: string) =>
      wrapMutation(
        () => assignBayMutation.mutateAsync({ bookingId, washBayId }),
        'Đã gán buồng rửa thành công.',
      ),
    [assignBayMutation],
  )

  const startService = useCallback(
    (bookingId: string, note?: string) =>
      wrapMutation(
        () => startServiceMutation.mutateAsync({ bookingId, note }),
        'Đã bắt đầu dịch vụ.',
      ),
    [startServiceMutation],
  )

  const completeServiceStep = useCallback(
    (stepId: string, _staffProfileId: string) => {
      const bookingId = findBookingIdByStepId(stepId)
      if (!bookingId) {
        return Promise.resolve({
          success: false,
          message: 'Không tìm thấy booking cho bước dịch vụ này.',
        })
      }

      return wrapMutation(
        () => completeStepMutation.mutateAsync({ bookingId, stepId }),
        'Đã hoàn thành bước dịch vụ.',
      )
    },
    [completeStepMutation, findBookingIdByStepId],
  )

  const completeService = useCallback(
    (bookingId: string) =>
      wrapMutation(
        () => completeServiceMutation.mutateAsync(bookingId),
        'Đã hoàn thành dịch vụ.',
      ),
    [completeServiceMutation],
  )

  const markBookingPaid = useCallback(
    (bookingId: string) =>
      wrapMutation(
        async () => markPaidMutation.mutateAsync(bookingId),
        'Xác nhận thanh toán thành công.',
        (booking) => ({
          earnedPoints: mapApiBooking(booking).earned_points,
        }),
      ),
    [markPaidMutation],
  )

  const createPayosPayment = useCallback(
    (bookingId: string) =>
      wrapMutation(
        async () => payosMutation.mutateAsync(bookingId),
        'Đã tạo link thanh toán PayOS.',
        (result) => ({
          checkoutUrl: result.payment.checkout_url,
          paymentId: result.payment.id,
        }),
      ),
    [payosMutation],
  )

  const createInspection = useCallback(
    (data: CreateInspectionInput, _staffProfileId: string) =>
      wrapMutation(
        async () =>
          createInspectionMutation.mutateAsync({
            bookingId: data.booking_id,
            payload: data,
          }),
        'Đã lưu biên bản kiểm tra.',
        (inspection) => ({ inspectionId: inspection.id }),
      ),
    [createInspectionMutation],
  )

  const isMutating =
    checkInMutation.isPending ||
    walkInMutation.isPending ||
    assignBayMutation.isPending ||
    startServiceMutation.isPending ||
    completeStepMutation.isPending ||
    completeServiceMutation.isPending ||
    markPaidMutation.isPending ||
    payosMutation.isPending ||
    cancelBookingMutation.isPending ||
    markNoShowMutation.isPending ||
    resolveLateArrivalMutation.isPending ||
    createInspectionMutation.isPending

  const value = useMemo(
    () => ({
      isLoading: bookingsQuery.isLoading,
      isMutating,
      bookings,
      servicePackages,
      inspections: allInspections,
      washBays,
      washHistories,
      isLoadingWashHistories: washHistoriesQuery.isLoading,
      isWashHistoriesError: washHistoriesQuery.isError,
      washHistoriesError: washHistoriesQuery.isError
        ? getApiErrorMessage(
            washHistoriesQuery.error,
            'Không thể tải lịch sử rửa.',
          )
        : null,
      refetchWashHistories,
      getBookingById,
      getWashBayById,
      getAvailableWashBaysForBooking,
      fetchAvailableWashBaysForBooking,
      getServicePackageName: getServicePackageNameFn,
      getServicePackagesByVehicleType: getServicePackagesByVehicleTypeFn,
      assignWashBay,
      searchCheckInCandidates,
      checkInBooking,
      createWalkInBooking,
      cancelBooking,
      markBookingNoShow,
      getLateArrivalOptions,
      resolveLateArrival,
      getServiceStepsByBookingId,
      fetchServiceSteps,
      startService,
      completeServiceStep,
      completeService,
      markBookingPaid,
      createPayosPayment,
      getInspectionsByBookingId,
      fetchInspections,
      createInspection,
      refreshBookings: invalidateBookings,
    }),
    [
      bookingsQuery.isLoading,
      isMutating,
      bookings,
      servicePackages,
      allInspections,
      washBays,
      washHistories,
      washHistoriesQuery.isLoading,
      washHistoriesQuery.isError,
      washHistoriesQuery.error,
      refetchWashHistories,
      getBookingById,
      getWashBayById,
      getAvailableWashBaysForBooking,
      fetchAvailableWashBaysForBooking,
      getServicePackageNameFn,
      getServicePackagesByVehicleTypeFn,
      assignWashBay,
      searchCheckInCandidates,
      checkInBooking,
      createWalkInBooking,
      cancelBooking,
      markBookingNoShow,
      getLateArrivalOptions,
      resolveLateArrival,
      getServiceStepsByBookingId,
      fetchServiceSteps,
      startService,
      completeServiceStep,
      completeService,
      markBookingPaid,
      createPayosPayment,
      getInspectionsByBookingId,
      fetchInspections,
      createInspection,
      invalidateBookings,
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
