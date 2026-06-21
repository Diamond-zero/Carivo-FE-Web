import { lazy, type ComponentType } from 'react'

function lazyNamed(
  factory: () => Promise<Record<string, ComponentType<object>>>,
  exportName: string,
) {
  return lazy(() =>
    factory().then((module) => ({
      default: module[exportName],
    })),
  )
}

export const PublicHomePage = lazyNamed(
  () => import('../pages/public/PublicHomePage'),
  'PublicHomePage',
)

export const LoginPage = lazyNamed(
  () => import('../pages/auth/LoginPage'),
  'LoginPage',
)

export const RegisterPage = lazyNamed(
  () => import('../pages/auth/RegisterPage'),
  'RegisterPage',
)

export const AdminLayout = lazyNamed(
  () => import('../components/layout/admin/AdminLayout'),
  'AdminLayout',
)

export const StaffLayout = lazyNamed(
  () => import('../components/layout/StaffLayout'),
  'StaffLayout',
)

export const AdminDashboardPage = lazyNamed(
  () => import('../pages/admin/dashboard/AdminDashboardPage'),
  'AdminDashboardPage',
)

export const AdminCustomerListPage = lazyNamed(
  () => import('../pages/admin/users/AdminCustomerListPage'),
  'AdminCustomerListPage',
)

export const AdminCustomerDetailPage = lazyNamed(
  () => import('../pages/admin/users/AdminCustomerDetailPage'),
  'AdminCustomerDetailPage',
)

export const AdminStaffListPage = lazyNamed(
  () => import('../pages/admin/users/AdminStaffListPage'),
  'AdminStaffListPage',
)

export const AdminStaffFormPage = lazyNamed(
  () => import('../pages/admin/users/AdminStaffFormPage'),
  'AdminStaffFormPage',
)

export const AdminGarageListPage = lazyNamed(
  () => import('../pages/admin/garages/AdminGarageListPage'),
  'AdminGarageListPage',
)

export const AdminGarageFormPage = lazyNamed(
  () => import('../pages/admin/garages/AdminGarageFormPage'),
  'AdminGarageFormPage',
)

export const AdminWashBayManagementPage = lazyNamed(
  () => import('../pages/admin/garages/AdminWashBayManagementPage'),
  'AdminWashBayManagementPage',
)

export const AdminServicePackageListPage = lazyNamed(
  () => import('../pages/admin/services/AdminServicePackageListPage'),
  'AdminServicePackageListPage',
)

export const AdminServicePackageFormPage = lazyNamed(
  () => import('../pages/admin/services/AdminServicePackageFormPage'),
  'AdminServicePackageFormPage',
)

export const AdminServicePackageStepsPage = lazyNamed(
  () => import('../pages/admin/services/AdminServicePackageStepsPage'),
  'AdminServicePackageStepsPage',
)

export const AdminBookingListPage = lazyNamed(
  () => import('../pages/admin/bookings/AdminBookingListPage'),
  'AdminBookingListPage',
)

export const AdminBookingDetailPage = lazyNamed(
  () => import('../pages/admin/bookings/AdminBookingDetailPage'),
  'AdminBookingDetailPage',
)

export const AdminTierRulesPage = lazyNamed(
  () => import('../pages/admin/loyalty/AdminTierRulesPage'),
  'AdminTierRulesPage',
)

export const AdminPromotionListPage = lazyNamed(
  () => import('../pages/admin/promotions/AdminPromotionListPage'),
  'AdminPromotionListPage',
)

export const AdminPromotionFormPage = lazyNamed(
  () => import('../pages/admin/promotions/AdminPromotionFormPage'),
  'AdminPromotionFormPage',
)

export const AdminAnalyticsRevenuePage = lazyNamed(
  () => import('../pages/admin/analytics/AdminAnalyticsRevenuePage'),
  'AdminAnalyticsRevenuePage',
)

export const AdminAnalyticsBookingsPage = lazyNamed(
  () => import('../pages/admin/analytics/AdminAnalyticsBookingsPage'),
  'AdminAnalyticsBookingsPage',
)

export const AdminAnalyticsWashBayPage = lazyNamed(
  () => import('../pages/admin/analytics/AdminAnalyticsWashBayPage'),
  'AdminAnalyticsWashBayPage',
)

export const AdminAuditLogsPage = lazyNamed(
  () => import('../pages/admin/audit/AdminAuditLogsPage'),
  'AdminAuditLogsPage',
)

export const AdminSurveysPage = lazyNamed(
  () => import('../pages/admin/surveys/AdminSurveysPage'),
  'AdminSurveysPage',
)

export const AdminResearchExportPage = lazyNamed(
  () => import('../pages/admin/research/AdminResearchExportPage'),
  'AdminResearchExportPage',
)

export const AdminSettingsPage = lazyNamed(
  () => import('../pages/admin/settings/AdminSettingsPage'),
  'AdminSettingsPage',
)

export const DashboardPage = lazyNamed(
  () => import('../pages/dashboard/DashboardPage'),
  'DashboardPage',
)

export const BookingListPage = lazyNamed(
  () => import('../pages/bookings/BookingListPage'),
  'BookingListPage',
)

export const CheckInPage = lazyNamed(
  () => import('../pages/bookings/CheckInPage'),
  'CheckInPage',
)

export const WalkInCreatePage = lazyNamed(
  () => import('../pages/bookings/WalkInCreatePage'),
  'WalkInCreatePage',
)

export const BookingDetailPage = lazyNamed(
  () => import('../pages/bookings/BookingDetailPage'),
  'BookingDetailPage',
)

export const ServiceExecutionPage = lazyNamed(
  () => import('../pages/service/ServiceExecutionPage'),
  'ServiceExecutionPage',
)

export const InspectionPage = lazyNamed(
  () => import('../pages/service/InspectionPage'),
  'InspectionPage',
)

export const WashHistoryPage = lazyNamed(
  () => import('../pages/history/WashHistoryPage'),
  'WashHistoryPage',
)

export const CustomerListPage = lazyNamed(
  () => import('../pages/customers/CustomerListPage'),
  'CustomerListPage',
)

export const CustomerDetailPage = lazyNamed(
  () => import('../pages/customers/CustomerDetailPage'),
  'CustomerDetailPage',
)

export const SettingsPage = lazyNamed(
  () => import('../pages/settings/SettingsPage'),
  'SettingsPage',
)
