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
import {
  getAvailableWashBaysApi,
  getStaffWorkspaceWashBaysApi,
} from '../api/washBay.api'
import { getWashHistoriesApi } from '../api/washHistory.api'
import { getApiErrorMessage } from '../api/client'
import { useAuth } from './AuthContext'
import {
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
import { staffQueryKeys, workspaceQueryKeys, staffTaskQueryKeys } from '../hooks/api/staff/queryKeys'
import { useMyCapabilities } from '../hooks/api/staff/useStaffCapabilities'
import { mapWashHistoriesWithBookingFallback } from '../utils/washHistoryEnrichment'
import { DEFAULT_BOOKING_FILTERS, toBookingListApiParams } from '../utils/bookingFilters'

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
  isLoadingWashBays: boolean
  isWashBaysError: boolean
  washBaysError: string | null
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
  /** Đặt vehicle_type hiện tại để BE filter `/service-packages` đúng cách. */
  setServicePackageVehicleType: (
    vehicleType: Booking['vehicle_type'] | null,
  ) => void
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
    allowEarlyStart?: boolean,
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
  const staffCapabilities = useMyCapabilities()
  const queryClient = useQueryClient()
  const garageId = session?.staffProfile.garage_id ?? undefined
  const canReadWashHistories = staffCapabilities.includes(
    'wash_history.read_garage',
  )

  const [stepsByBooking, setStepsByBooking] = useState<
    Record<string, BookingServiceStep[]>
  >({})
  const [inspectionsByBooking, setInspectionsByBooking] = useState<
    Record<string, VehicleInspection[]>
  >({})
  const [availableBaysByBooking, setAvailableBaysByBooking] = useState<
    Record<string, WashBay[]>
  >({})
  /**
   * vehicle_type staff đang xem cho dropdown service-package. Mặc định null
   * = BE trả toàn bộ (giữ backward-compat cho các màn khác). Khi staff đổi
   * "Loại xe" trong WalkInForm thì state này được set để trigger fetch mới
   * với query param BE-side filter. Quan trọng: nếu KHÔNG truyền
   * `vehicle_type`, BE chỉ trả 1 MOTORBIKE add-on (xem thử nghiệm API).
   */
  const [servicePackageVehicleType, setServicePackageVehicleType] = useState<
    Booking['vehicle_type'] | null
  >(null)

  const washBaysQuery = useQuery({
    queryKey: staffQueryKeys.washBays(garageId),
    queryFn: async () => {
      const washBays = await getStaffWorkspaceWashBaysApi()
      return washBays.map((washBay) => mapApiWashBay(washBay, garageId))
    },
    enabled: isAuthenticated && Boolean(garageId),
    staleTime: 30_000,
  })

  const bookingsQuery = useQuery({
    queryKey: staffQueryKeys.bookings(garageId),
    queryFn: async () => {
      const params = toBookingListApiParams(DEFAULT_BOOKING_FILTERS, garageId)
      const result = await getStaffBookingsApi(params)
      return {
        raw: result.bookings,
        mapped: result.bookings.map(mapApiBooking),
      }
    },
    enabled: isAuthenticated && Boolean(garageId),
  })

  const servicePackagesQuery = useQuery({
    queryKey: [
      ...staffQueryKeys.servicePackages,
      servicePackageVehicleType ?? 'ALL',
    ],
    queryFn: async () => {
      // BE list `/service-packages` mặc định không trả đầy đủ gói MOTORBIKE
      // (chỉ trả 1 gói ADDON). Phải truyền `vehicle_type` để BE filter server
      // side — nếu không dropdown "Gói dịch vụ" sẽ trống khi staff chọn xe máy.
      const packages = await getServicePackagesApi(
        servicePackageVehicleType ?? undefined,
      )
      return packages.map(mapApiServicePackage)
    },
    enabled: isAuthenticated,
  })

  const washHistoriesQuery = useQuery({
    queryKey: staffQueryKeys.washHistories(garageId),
    queryFn: async () => {
      // STAFF: BE tự giới hạn theo StaffProfile.garage_id — không gửi garage_id
      const result = await getWashHistoriesApi({ limit: 100 })

      // Đợi bookings của cùng garage fetch xong để làm fallback cho các bản ghi
      // walk-in / bản ghi cũ mà payload list BE không populate `vehicle` /
      // `customer`. Nếu bookings fetch fail (vd staff bị đổi garage), vẫn trả
      // danh sách gốc để UI không trắng trơn.
      let cachedBookings: ApiBooking[]
      try {
        const cached = await queryClient.ensureQueryData<{ raw: ApiBooking[] }>({
          queryKey: staffQueryKeys.bookings(garageId),
        })
        cachedBookings = cached.raw
      } catch {
        cachedBookings = []
      }

      return mapWashHistoriesWithBookingFallback(result.histories, cachedBookings)
    },
    enabled:
      isAuthenticated &&
      Boolean(garageId) &&
      canReadWashHistories,
    staleTime: 30_000,
  })

  const bookings = useMemo(
    () => bookingsQuery.data?.mapped ?? [],
    [bookingsQuery.data?.mapped],
  )
  const servicePackages = useMemo(
    () => servicePackagesQuery.data ?? [],
    [servicePackagesQuery.data],
  )
  const washHistories = useMemo(
    () => washHistoriesQuery.data ?? [],
    [washHistoriesQuery.data],
  )

  const washBays = useMemo(() => {
    if (!garageId) return []
    return washBaysQuery.data ?? []
  }, [garageId, washBaysQuery.data])

  const invalidateBookings = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: staffQueryKeys.bookings(garageId),
    })
    // BookingListPage dùng `useStaffBookingList` (key có tham số filter) — phải
    // refetch mọi list của staff để reload sau khi mutation (mark-paid, cancel...).
    await queryClient.invalidateQueries({
      queryKey: ['staff', 'bookings', garageId, 'list'],
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
      allowEarlyStart,
    }: {
      bookingId: string
      note?: string
      allowEarlyStart?: boolean
    }) =>
      startServiceApi(bookingId, {
        ...(note ? { note } : {}),
        ...(allowEarlyStart !== undefined ? { allow_early_start: allowEarlyStart } : {}),
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
    onSuccess: async (_data, bookingId) => {
      await invalidateBookings()
      await queryClient.invalidateQueries({
        queryKey: staffQueryKeys.bookingDetail(bookingId),
      })
    },
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
    }) => {
      // BE `createVehicleInspectionSchema` validate image schema:
      //   image_url: required string
      //   public_id: optional string (preprocess '' => undefined; NULL vẫn fail
      //     với "expected string, received null")
      //   caption:   optional string (giống public_id)
      // → KHÔNG gửi các field optional là null — phải omit hoàn toàn.
      const trimmedNote = payload.note.trim()
      return createBookingInspectionApi(bookingId, {
        type: payload.type,
        ...(trimmedNote ? { note: trimmedNote } : {}),
        images: payload.images.map((url) => ({ image_url: url })),
      })
    },
    onSuccess: async (_, { bookingId }) => {
      await fetchInspections(bookingId)
      // BE đã đổi phase/blockers/available_actions ngay sau khi tạo inspection
      // (xem vehicleInspection.service.js → createInspection → withTransaction
      // gọi completePostServiceStepFromInspection nếu type = AFTER_WASH, và
      // đổi workflow_phase từ SERVICE_IN_PROGRESS → WAITING_AFTER_WASH_INSPECTION
      // / READY_TO_COMPLETE_SERVICE). Phải invalidate mọi cache liên quan tới
      // workflow để UI CS Staff thấy ngay action `booking.service.complete`.
      await queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.workflow(bookingId),
      })
      await queryClient.invalidateQueries({
        queryKey: staffTaskQueryKeys.workflow(bookingId),
      })
      await queryClient.invalidateQueries({
        queryKey: staffTaskQueryKeys.serviceItems(bookingId),
      })
      await queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.bookings(garageId),
      })
      await queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.inspectionClaim(),
      })
      await invalidateBookings()
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
    (bookingId: string, note?: string, allowEarlyStart?: boolean) =>
      wrapMutation(
        () => startServiceMutation.mutateAsync({ bookingId, note, allowEarlyStart }),
        'Đã bắt đầu dịch vụ.',
      ),
    [startServiceMutation],
  )

  const completeServiceStep = useCallback(
    (stepId: string, _staffProfileId: string) => {
      void _staffProfileId
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
    (data: CreateInspectionInput, staffProfileId: string) => {
      void staffProfileId
      return wrapMutation(
        async () =>
          createInspectionMutation.mutateAsync({
            bookingId: data.booking_id,
            payload: data,
          }),
        'Đã lưu biên bản kiểm tra.',
        (inspection) => ({ inspectionId: inspection.id }),
      )
    },
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
      isLoadingWashBays: washBaysQuery.isLoading,
      isWashBaysError: washBaysQuery.isError,
      washBaysError: washBaysQuery.isError
        ? getApiErrorMessage(
            washBaysQuery.error,
            'Không thể tải danh sách buồng rửa.',
          )
        : null,
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
      setServicePackageVehicleType,
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
      washBaysQuery.isLoading,
      washBaysQuery.isError,
      washBaysQuery.error,
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
