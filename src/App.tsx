import { Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PlaceholderPage } from './components/layout/PlaceholderPage'
import { RouteLoadingFallback } from './components/ui/RouteLoadingFallback'
import { AdminAuthProvider } from './contexts/AdminAuthContext'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { adminPlaceholderRoutes } from './constants/adminPlaceholderRoutes'
import {
  AdminAnalyticsBookingsPage,
  AdminAnalyticsRevenuePage,
  AdminAnalyticsWashBayPage,
  AdminAuditLogsPage,
  AdminBookingDetailPage,
  AdminBookingListPage,
  AdminCustomerDetailPage,
  AdminCustomerListPage,
  AdminCustomerLoyaltyPage,
  AdminCustomerNotificationsPage,
  AdminCustomerVehiclesPage,
  AdminDashboardPage,
  AdminGarageFormPage,
  AdminGarageListPage,
  AdminLayout,
  AdminPromotionFormPage,
  AdminPromotionListPage,
  AdminResearchExportPage,
  AdminServicePackageFormPage,
  AdminServicePackageListPage,
  AdminServicePackageStepsPage,
  AdminSettingsPage,
  AdminStaffFormPage,
  AdminStaffListPage,
  AdminSurveysPage,
  AdminLoyaltyOverviewPage,
  AdminWaitlistsPage,
  AdminWashHistoryPage,
  AdminTierRulesPage,
  AdminUsersListPage,
  AdminWashBayManagementPage,
  BookingDetailPage,
  BookingListPage,
  CheckInPage,
  CustomerDetailPage,
  CustomerListPage,
  DashboardPage,
  InspectionPage,
  LoginPage,
  PublicHomePage,
  RegisterPage,
  ServiceExecutionPage,
  SettingsPage,
  StaffLayout,
  WalkInCreatePage,
  WashHistoryPage,
} from './routes/lazyPages'

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>
}

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <ToastProvider>
          <Routes>
            <Route
              path="/"
              element={
                <LazyPage>
                  <PublicHomePage />
                </LazyPage>
              }
            />
            <Route path="/homepage" element={<Navigate to="/" replace />} />
            <Route
              path="/login"
              element={
                <LazyPage>
                  <LoginPage />
                </LazyPage>
              }
            />
            <Route
              path="/register"
              element={
                <LazyPage>
                  <RegisterPage />
                </LazyPage>
              }
            />

            <Route element={<AdminProtectedRoute />}>
              <Route
                element={
                  <LazyPage>
                    <AdminLayout />
                  </LazyPage>
                }
              >
                <Route
                  path="/admin/dashboard"
                  element={
                    <LazyPage>
                      <AdminDashboardPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/users/customers"
                  element={
                    <LazyPage>
                      <AdminCustomerListPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/users/all"
                  element={
                    <LazyPage>
                      <AdminUsersListPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/users/customers/:id"
                  element={
                    <LazyPage>
                      <AdminCustomerDetailPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/users/customers/:id/vehicles"
                  element={
                    <LazyPage>
                      <AdminCustomerVehiclesPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/users/customers/:id/loyalty"
                  element={
                    <LazyPage>
                      <AdminCustomerLoyaltyPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/users/customers/:id/notifications"
                  element={
                    <LazyPage>
                      <AdminCustomerNotificationsPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/users/staff"
                  element={
                    <LazyPage>
                      <AdminStaffListPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/users/staff/new"
                  element={
                    <LazyPage>
                      <AdminStaffFormPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/users/staff/:profileId/edit"
                  element={
                    <LazyPage>
                      <AdminStaffFormPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/garages"
                  element={
                    <LazyPage>
                      <AdminGarageListPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/garages/new"
                  element={
                    <LazyPage>
                      <AdminGarageFormPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/garages/:garageId/edit"
                  element={
                    <LazyPage>
                      <AdminGarageFormPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/garages/wash-bays"
                  element={
                    <LazyPage>
                      <AdminWashBayManagementPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/services/packages"
                  element={
                    <LazyPage>
                      <AdminServicePackageListPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/services/packages/new"
                  element={
                    <LazyPage>
                      <AdminServicePackageFormPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/services/packages/:packageId/edit"
                  element={
                    <LazyPage>
                      <AdminServicePackageFormPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/services/packages/:packageId/steps"
                  element={
                    <LazyPage>
                      <AdminServicePackageStepsPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/bookings"
                  element={
                    <LazyPage>
                      <AdminBookingListPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/bookings/:bookingId"
                  element={
                    <LazyPage>
                      <AdminBookingDetailPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/waitlists"
                  element={
                    <LazyPage>
                      <AdminWaitlistsPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/wash-histories"
                  element={
                    <LazyPage>
                      <AdminWashHistoryPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/loyalty/tier-rules"
                  element={
                    <LazyPage>
                      <AdminTierRulesPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/loyalty/overview"
                  element={
                    <LazyPage>
                      <AdminLoyaltyOverviewPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/promotions"
                  element={
                    <LazyPage>
                      <AdminPromotionListPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/promotions/new"
                  element={
                    <LazyPage>
                      <AdminPromotionFormPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/promotions/:promotionId/edit"
                  element={
                    <LazyPage>
                      <AdminPromotionFormPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/analytics/revenue"
                  element={
                    <LazyPage>
                      <AdminAnalyticsRevenuePage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/analytics/bookings"
                  element={
                    <LazyPage>
                      <AdminAnalyticsBookingsPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/analytics/wash-bay"
                  element={
                    <LazyPage>
                      <AdminAnalyticsWashBayPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/audit-logs"
                  element={
                    <LazyPage>
                      <AdminAuditLogsPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/surveys"
                  element={
                    <LazyPage>
                      <AdminSurveysPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/research/export"
                  element={
                    <LazyPage>
                      <AdminResearchExportPage />
                    </LazyPage>
                  }
                />
                {adminPlaceholderRoutes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      <PlaceholderPage
                        title={route.title}
                        description={route.description}
                      />
                    }
                  />
                ))}
                <Route
                  path="/admin/users"
                  element={<Navigate to="/admin/users/customers" replace />}
                />
                <Route
                  path="/admin/settings"
                  element={
                    <LazyPage>
                      <AdminSettingsPage />
                    </LazyPage>
                  }
                />
              </Route>
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route
                element={
                  <LazyPage>
                    <StaffLayout />
                  </LazyPage>
                }
              >
                <Route
                  path="/dashboard"
                  element={
                    <LazyPage>
                      <DashboardPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/bookings"
                  element={
                    <LazyPage>
                      <BookingListPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/bookings/check-in"
                  element={
                    <LazyPage>
                      <CheckInPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/bookings/walk-in"
                  element={
                    <LazyPage>
                      <WalkInCreatePage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/bookings/:id"
                  element={
                    <LazyPage>
                      <BookingDetailPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/service/execution"
                  element={
                    <LazyPage>
                      <ServiceExecutionPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/service/inspection"
                  element={
                    <LazyPage>
                      <InspectionPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/history/wash"
                  element={
                    <LazyPage>
                      <WashHistoryPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <LazyPage>
                      <CustomerListPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/customers/:id"
                  element={
                    <LazyPage>
                      <CustomerDetailPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <LazyPage>
                      <SettingsPage />
                    </LazyPage>
                  }
                />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/homepage" replace />} />
          </Routes>
        </ToastProvider>
      </AdminAuthProvider>
    </AuthProvider>
  )
}

export default App
