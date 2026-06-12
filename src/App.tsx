import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminLayout } from './components/layout/admin/AdminLayout'
import { PlaceholderPage } from './components/layout/PlaceholderPage'
import { StaffLayout } from './components/layout/StaffLayout'
import { AdminAuthProvider } from './contexts/AdminAuthContext'
import { AuthProvider } from './contexts/AuthContext'
import { BookingProvider } from './contexts/BookingContext'
import { ToastProvider } from './contexts/ToastContext'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { BookingDetailPage } from './pages/bookings/BookingDetailPage'
import { BookingListPage } from './pages/bookings/BookingListPage'
import { CheckInPage } from './pages/bookings/CheckInPage'
import { WalkInCreatePage } from './pages/bookings/WalkInCreatePage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { WashHistoryPage } from './pages/history/WashHistoryPage'
import { CustomerDetailPage } from './pages/customers/CustomerDetailPage'
import { CustomerListPage } from './pages/customers/CustomerListPage'
import { InspectionPage } from './pages/service/InspectionPage'
import { PublicHomePage } from './pages/public/PublicHomePage'
import { ServiceExecutionPage } from './pages/service/ServiceExecutionPage'
import { adminPlaceholderRoutes } from './constants/adminPlaceholderRoutes'
import { AdminDashboardPage } from './pages/admin/dashboard/AdminDashboardPage'
import { AdminSettingsPage } from './pages/admin/settings/AdminSettingsPage'
import { AdminCustomerDetailPage } from './pages/admin/users/AdminCustomerDetailPage'
import { AdminCustomerListPage } from './pages/admin/users/AdminCustomerListPage'
import { AdminGarageFormPage } from './pages/admin/garages/AdminGarageFormPage'
import { AdminGarageListPage } from './pages/admin/garages/AdminGarageListPage'
import { AdminWashBayManagementPage } from './pages/admin/garages/AdminWashBayManagementPage'
import { AdminBookingDetailPage } from './pages/admin/bookings/AdminBookingDetailPage'
import { AdminBookingListPage } from './pages/admin/bookings/AdminBookingListPage'
import { AdminTierRulesPage } from './pages/admin/loyalty/AdminTierRulesPage'
import { AdminServicePackageFormPage } from './pages/admin/services/AdminServicePackageFormPage'
import { AdminServicePackageListPage } from './pages/admin/services/AdminServicePackageListPage'
import { AdminServicePackageStepsPage } from './pages/admin/services/AdminServicePackageStepsPage'
import { AdminStaffFormPage } from './pages/admin/users/AdminStaffFormPage'
import { AdminStaffListPage } from './pages/admin/users/AdminStaffListPage'
import { SettingsPage } from './pages/settings/SettingsPage'

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
      <BookingProvider>
        <ToastProvider>
        <Routes>
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/homepage" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users/customers" element={<AdminCustomerListPage />} />
            <Route
              path="/admin/users/customers/:id"
              element={<AdminCustomerDetailPage />}
            />
            <Route path="/admin/users/staff" element={<AdminStaffListPage />} />
            <Route path="/admin/users/staff/new" element={<AdminStaffFormPage />} />
            <Route
              path="/admin/users/staff/:profileId/edit"
              element={<AdminStaffFormPage />}
            />
            <Route path="/admin/garages" element={<AdminGarageListPage />} />
            <Route path="/admin/garages/new" element={<AdminGarageFormPage />} />
            <Route
              path="/admin/garages/:garageId/edit"
              element={<AdminGarageFormPage />}
            />
            <Route
              path="/admin/garages/wash-bays"
              element={<AdminWashBayManagementPage />}
            />
            <Route
              path="/admin/services/packages"
              element={<AdminServicePackageListPage />}
            />
            <Route
              path="/admin/services/packages/new"
              element={<AdminServicePackageFormPage />}
            />
            <Route
              path="/admin/services/packages/:packageId/edit"
              element={<AdminServicePackageFormPage />}
            />
            <Route
              path="/admin/services/packages/:packageId/steps"
              element={<AdminServicePackageStepsPage />}
            />
            <Route path="/admin/bookings" element={<AdminBookingListPage />} />
            <Route
              path="/admin/bookings/:bookingId"
              element={<AdminBookingDetailPage />}
            />
            <Route
              path="/admin/loyalty/tier-rules"
              element={<AdminTierRulesPage />}
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
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<StaffLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/bookings" element={<BookingListPage />} />
            <Route path="/bookings/check-in" element={<CheckInPage />} />
            <Route path="/bookings/walk-in" element={<WalkInCreatePage />} />
            <Route path="/bookings/:id" element={<BookingDetailPage />} />
            <Route path="/service/execution" element={<ServiceExecutionPage />} />
            <Route path="/service/inspection" element={<InspectionPage />} />
            <Route path="/history/wash" element={<WashHistoryPage />} />
            <Route path="/customers" element={<CustomerListPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/homepage" replace />} />
        </Routes>
        </ToastProvider>
      </BookingProvider>
      </AdminAuthProvider>
    </AuthProvider>
  )
}

export default App
