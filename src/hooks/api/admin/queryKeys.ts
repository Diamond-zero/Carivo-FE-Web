export const adminQueryKeys = {
  all: ['admin'] as const,
  garages: (params?: unknown) => [...adminQueryKeys.all, 'garages', params] as const,
  garage: (id: string) => [...adminQueryKeys.all, 'garage', id] as const,
  washBays: (params?: unknown) => [...adminQueryKeys.all, 'wash-bays', params] as const,
  washBay: (id: string) => [...adminQueryKeys.all, 'wash-bay', id] as const,
  staff: (params?: unknown) => [...adminQueryKeys.all, 'staff', params] as const,
  staffProfile: (id: string) => [...adminQueryKeys.all, 'staff-profile', id] as const,
  customers: (params?: unknown) => [...adminQueryKeys.all, 'customers', params] as const,
  customer: (id: string) => [...adminQueryKeys.all, 'customer', id] as const,
  users: (params?: unknown) => [...adminQueryKeys.all, 'users', params] as const,
  user: (id: string) => [...adminQueryKeys.all, 'user', id] as const,
  vehicles: (params?: unknown) => [...adminQueryKeys.all, 'vehicles', params] as const,
  bookings: (params?: unknown) => [...adminQueryKeys.all, 'bookings', params] as const,
  booking: (id: string) => [...adminQueryKeys.all, 'booking', id] as const,
  servicePackages: (params?: unknown) =>
    [...adminQueryKeys.all, 'service-packages', params] as const,
  servicePackage: (id: string) =>
    [...adminQueryKeys.all, 'service-package', id] as const,
  promotions: (params?: unknown) => [...adminQueryKeys.all, 'promotions', params] as const,
  promotion: (id: string) => [...adminQueryKeys.all, 'promotion', id] as const,
  tierRules: () => [...adminQueryKeys.all, 'tier-rules'] as const,
  analyticsOverview: (params?: unknown) =>
    [...adminQueryKeys.all, 'analytics-overview', params] as const,
  analyticsBookings: (params?: unknown) =>
    [...adminQueryKeys.all, 'analytics-bookings', params] as const,
  analyticsRevenue: (params?: unknown) =>
    [...adminQueryKeys.all, 'analytics-revenue', params] as const,
  analyticsWashBays: (params?: unknown) =>
    [...adminQueryKeys.all, 'analytics-wash-bays', params] as const,
  auditLogs: (params?: unknown) => [...adminQueryKeys.all, 'audit-logs', params] as const,
  surveys: (params?: unknown) => [...adminQueryKeys.all, 'surveys', params] as const,
  surveyResponses: (surveyId: string) =>
    [...adminQueryKeys.all, 'survey-responses', surveyId] as const,
  waitlists: (params?: unknown) => [...adminQueryKeys.all, 'waitlists', params] as const,
  washHistories: (params?: unknown) =>
    [...adminQueryKeys.all, 'wash-histories', params] as const,
  expiringPoints: (params?: unknown) =>
    [...adminQueryKeys.all, 'expiring-points', params] as const,
  loyaltyTransactions: (params?: unknown) =>
    [...adminQueryKeys.all, 'loyalty-transactions', params] as const,
  loyaltyCustomer: (id: string) =>
    [...adminQueryKeys.all, 'loyalty-customer', id] as const,
  researchReports: (params?: unknown) =>
    [...adminQueryKeys.all, 'research', params] as const,
  researchReport: (id: string) =>
    [...adminQueryKeys.all, 'research', id] as const,
  uploads: (params?: unknown) =>
    [...adminQueryKeys.all, 'uploads', params] as const,
  notifications: (customerId?: string) =>
    [...adminQueryKeys.all, 'customer-notifications', customerId] as const,
}
