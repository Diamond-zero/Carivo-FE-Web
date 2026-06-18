export const staffQueryKeys = {
  bookings: (garageId?: string) => ['staff', 'bookings', garageId] as const,
  bookingList: (garageId?: string, params?: unknown) =>
    ['staff', 'bookings', garageId, 'list', params] as const,
  checkInSearch: (garageId?: string, query?: string) =>
    ['staff', 'bookings', garageId, 'check-in', query] as const,
  servicePackages: ['staff', 'service-packages'] as const,
  washHistories: (garageId?: string) => ['staff', 'wash-histories', garageId] as const,
  serviceSteps: (bookingId: string) => ['staff', 'bookings', bookingId, 'service-steps'] as const,
  inspections: (bookingId: string) => ['staff', 'bookings', bookingId, 'inspections'] as const,
  settings: ['staff', 'settings'] as const,
}
