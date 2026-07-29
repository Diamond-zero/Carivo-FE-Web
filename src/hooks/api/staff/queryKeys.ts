export const customerQueryKeys = {
  all: ['customer'] as const,
  notifications: (params?: unknown) =>
    ['customer', 'notifications', params] as const,
  notificationUnreadCount: () =>
    ['customer', 'notifications', 'unread-count'] as const,
  vehicles: (params?: unknown) =>
    ['customer', 'vehicles', params] as const,
  vehicle: (id: string) =>
    ['customer', 'vehicles', id] as const,
  loyaltyOverview: () => ['customer', 'loyalty'] as const,
  loyaltyTransactions: (params?: unknown) =>
    ['customer', 'loyalty', 'transactions', params] as const,
  availableSurveys: (bookingId?: string) =>
    ['customer', 'surveys', 'available', bookingId] as const,
  uploads: (params?: unknown) =>
    ['customer', 'uploads', params] as const,
}

export const staffQueryKeys = {
  bookings: (garageId?: string) =>
    ['staff', 'bookings', garageId] as const,
  bookingList: (garageId?: string, params?: unknown) =>
    ['staff', 'bookings', garageId, 'list', params] as const,
  checkInSearch: (garageId?: string, query?: string) =>
    ['staff', 'bookings', garageId, 'check-in', query] as const,
  servicePackages: ['staff', 'service-packages'] as const,
  washHistories: (garageId?: string) => ['staff', 'wash-histories', garageId] as const,
  washBays: (garageId?: string) => ['staff', 'wash-bays', garageId] as const,
  dashboardOverview: (garageId?: string, date?: string) =>
    ['staff', 'dashboard', garageId, date] as const,
  availableWashBays: (garageId?: string, vehicleType?: string) =>
    ['staff', 'wash-bays', garageId, 'available', vehicleType] as const,
  bookingDetail: (bookingId: string) => ['staff', 'bookings', 'detail', bookingId] as const,
  customers: (garageId?: string, search?: string) =>
    ['staff', 'customers', garageId, search] as const,
  customerDetail: (garageId?: string, customerId?: string) =>
    ['staff', 'customers', garageId, 'detail', customerId] as const,
  customerBookings: (garageId?: string, customerId?: string) =>
    ['staff', 'customers', garageId, 'bookings', customerId] as const,
  serviceSteps: (bookingId: string) => ['staff', 'bookings', bookingId, 'service-steps'] as const,
  inspections: (bookingId: string) => ['staff', 'bookings', bookingId, 'inspections'] as const,
  settings: ['staff', 'settings'] as const,
  capabilities: ['staff', 'capabilities'] as const,
  myTypeChangeRequests: ['staff', 'type-change-requests'] as const,
  waitlists: (garageId?: string) => ['staff', 'waitlists', garageId] as const,
  customerVouchers: (garageId?: string) => ['staff', 'customer-vouchers', garageId] as const,
}

export const workspaceQueryKeys = {
  bookings: (garageId?: string, params?: unknown) =>
    ['workspace', 'bookings', garageId, params] as const,
  workflow: (bookingId: string) => ['workspace', 'bookings', bookingId, 'workflow'] as const,
  /**
   * Tag dùng để invalidate tất cả workspace queries liên quan đến claim-inspection.
   * Mutation `useClaimInspection` set tag này để refetch list + workflow sau khi
   * staff nhận booking.
   */
  inspectionClaim: () => ['workspace', 'inspection-claim'] as const,
}

/**
 * Query keys cho staff tasks (service items + incidents).
 * Dùng cùng key family với workspace.workflow để các mutation pause/resume/
 * complete-early/confirm-complete/report-incident đều invalidate chung cache
 * → UI tự đồng bộ trạng thái countdown.
 */
export const staffTaskQueryKeys = {
  workflow: (bookingId: string) =>
    ['staff-tasks', 'bookings', bookingId, 'workflow'] as const,
  serviceItems: (bookingId: string) =>
    ['staff-tasks', 'bookings', bookingId, 'service-items'] as const,
  activeIncident: (bookingId: string) =>
    ['staff-tasks', 'bookings', bookingId, 'incidents', 'active'] as const,
}
