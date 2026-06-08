import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { StaffLayout } from './components/layout/StaffLayout'
import { AuthProvider } from './contexts/AuthContext'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { BookingListPage } from './pages/bookings/BookingListPage'
import { CheckInPage } from './pages/bookings/CheckInPage'
import { WalkInCreatePage } from './pages/bookings/WalkInCreatePage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { WashHistoryPage } from './pages/history/WashHistoryPage'
import { InspectionPage } from './pages/service/InspectionPage'
import { ServiceExecutionPage } from './pages/service/ServiceExecutionPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<StaffLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/bookings" element={<BookingListPage />} />
            <Route path="/bookings/check-in" element={<CheckInPage />} />
            <Route path="/bookings/walk-in" element={<WalkInCreatePage />} />
            <Route path="/service/execution" element={<ServiceExecutionPage />} />
            <Route path="/service/inspection" element={<InspectionPage />} />
            <Route path="/history/wash" element={<WashHistoryPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
