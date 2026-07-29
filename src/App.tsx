import { Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute'
import { CapabilityRoute } from './components/auth/CapabilityRoute'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PlaceholderPage } from './components/layout/PlaceholderPage'
import { RouteLoadingFallback } from './components/ui/RouteLoadingFallback'
import { AdminAuthProvider } from './contexts/AdminAuthContext'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { adminPlaceholderRoutes } from './constants/adminPlaceholderRoutes'
import {
  AdminAnalyticsBookingsPage,
  AdminAnalyticsCustomersPage,
  AdminAnalyticsRevenuePage,
  AdminAnalyticsWashBayPage,
  AdminAnalyticsGaragesPage,
  AdminAnalyticsServicesPage,
  AdminAnalyticsPromotionsPage,
  AdminAuditLogsPage,
  AdminBookingDetailPage,
  AdminBookingListPage,
  AdminBookingViolationsPage,
  AdminCustomerDetailPage,
  AdminCustomerListPage,
  AdminCustomerLoyaltyPage,
  AdminCustomerVehiclesPage,
  AdminDashboardPage,
  AdminGarageFormPage,
  AdminGarageListPage,
  AdminLayout,
  AdminPaymentDetailPage,
  AdminPaymentsListPage,
  AdminPromotionFormPage,
  AdminPromotionListPage,
  AdminResearchExportPage,
  AdminReviewsPage,
  AdminServicePackageFormPage,
  AdminServicePackageListPage,
  AdminServicePackageStepsPage,
  AdminServicePriceRulesPage,
  AdminSettingsPage,
  AdminCustomerCaseDetailPage,
  AdminCustomerCasesPage,
  AdminCustomerVouchersPage,
  AdminStaffFormPage,
  AdminStaffListPage,
  AdminStaffTypeChangeHistoryPage,
  AdminStaffTypeChangeRequestDetailPage,
  AdminStaffTypeChangeRequestsPage,
  AdminSurveysPage,
  AdminLoyaltyOverviewPage,
  AdminWashHistoryPage,
  AdminTierRulesPage,
  AdminUsersListPage,
  AdminWashBayManagementPage,
  AdminCameraDevicesPage,
  AdminPlateScansPage,
  AdminPlateScanReviewPage,
  AdminPlateScanMetricsPage,
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
  StaffCompensationVouchersPage,
  StaffHandoverPage,
  StaffCustomerCasesPage,
  StaffReviewsPage,
  StaffCustomerCaseDetailPage,
  StaffCustomerCaseSlaDashboardPage,
  StaffWalkInCaseCreatePage,
  StaffTechnicalAssessmentPage,
  StaffArrivalQueuePage,
  StaffPlateScanDetailPage,
  InspectionQueuePage,
  WorkspaceBookingDetailPage,
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
                  path="/admin/staff-type-change-requests"
                  element={
                    <LazyPage>
                      <AdminStaffTypeChangeRequestsPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/staff-type-change-requests/:requestId"
                  element={
                    <LazyPage>
                      <AdminStaffTypeChangeRequestDetailPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/staff-type-change-history"
                  element={
                    <LazyPage>
                      <AdminStaffTypeChangeHistoryPage />
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
                  path="/admin/services/prices"
                  element={
                    <LazyPage>
                      <AdminServicePriceRulesPage />
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
                  element={<Navigate to="/admin/bookings" replace />}
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
                  path="/admin/analytics/garages"
                  element={
                    <LazyPage>
                      <AdminAnalyticsGaragesPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/analytics/services"
                  element={
                    <LazyPage>
                      <AdminAnalyticsServicesPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/analytics/promotions"
                  element={
                    <LazyPage>
                      <AdminAnalyticsPromotionsPage />
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
                  path="/admin/payments"
                  element={
                    <LazyPage>
                      <AdminPaymentsListPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/payments/by-booking/:bookingId"
                  element={
                    <LazyPage>
                      <AdminPaymentDetailPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/payments/:paymentId"
                  element={
                    <LazyPage>
                      <AdminPaymentDetailPage />
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
                  path="/admin/booking-violations"
                  element={
                    <LazyPage>
                      <AdminBookingViolationsPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/reviews"
                  element={
                    <LazyPage>
                      <AdminReviewsPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/customer-vouchers"
                  element={
                    <LazyPage>
                      <AdminCustomerVouchersPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/analytics/customers"
                  element={
                    <LazyPage>
                      <AdminAnalyticsCustomersPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/customer-cases"
                  element={
                    <LazyPage>
                      <AdminCustomerCasesPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/customer-cases/:caseId"
                  element={
                    <LazyPage>
                      <AdminCustomerCaseDetailPage />
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
                <Route
                  path="/admin/arrivals/cameras"
                  element={
                    <LazyPage>
                      <AdminCameraDevicesPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/arrivals/scans"
                  element={
                    <LazyPage>
                      <AdminPlateScansPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/arrivals/scans/:scanId"
                  element={
                    <LazyPage>
                      <AdminPlateScanReviewPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/admin/arrivals/metrics"
                  element={
                    <LazyPage>
                      <AdminPlateScanMetricsPage />
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
                <Route element={<CapabilityRoute capability="booking.check_in" />}>
                  <Route
                    path="/bookings/check-in"
                    element={
                      <LazyPage>
                        <CheckInPage />
                      </LazyPage>
                    }
                  />
                </Route>
                <Route element={<CapabilityRoute capability="booking.walk_in.create" />}>
                  <Route
                    path="/bookings/walk-in"
                    element={
                      <LazyPage>
                        <WalkInCreatePage />
                      </LazyPage>
                    }
                  />
                </Route>
                <Route element={<CapabilityRoute capability="booking.read_garage" />}>
                  <Route
                    path="/bookings/:id"
                    element={
                      <LazyPage>
                        <BookingDetailPage />
                      </LazyPage>
                    }
                  />
                </Route>
                <Route
                  element={
                    <CapabilityRoute
                      capability={[
                        // Wash/Care staff: thực thi các bước được phân công.
                        'service_task.wash.execute_assigned',
                        'service_task.care.execute_assigned',
                        // Customer Service Staff (và admin): bắt đầu dịch vụ
                        // (start-service) rồi theo dõi tiến trình IN_PROGRESS.
                        'booking.service.read_garage',
                      ]}
                    />
                  }
                >
                  <Route
                    path="/service/execution"
                    element={
                      <LazyPage>
                        <ServiceExecutionPage />
                      </LazyPage>
                    }
                  />
                </Route>
                <Route element={<CapabilityRoute capability="inspection.create_assigned" />}>
                  <Route
                    path="/service/inspection"
                    element={
                      <LazyPage>
                        <InspectionPage />
                      </LazyPage>
                    }
                  />
                </Route>
                <Route element={<CapabilityRoute capability="inspection.claim_garage" />}>
                  <Route
                    path="/staff/inspection-queue"
                    element={
                      <LazyPage>
                        <InspectionQueuePage />
                      </LazyPage>
                    }
                  />
                </Route>
                <Route
                  element={
                    <CapabilityRoute capability="booking.workflow.read_garage" />
                  }
                >
                  <Route
                    path="/bookings/workspace/:id"
                    element={
                      <LazyPage>
                        <WorkspaceBookingDetailPage />
                      </LazyPage>
                    }
                  />
                </Route>
                <Route element={<CapabilityRoute capability="wash_history.read_garage" />}>
                  <Route
                    path="/history/wash"
                    element={
                      <LazyPage>
                        <WashHistoryPage />
                      </LazyPage>
                    }
                  />
                </Route>
                <Route element={<CapabilityRoute capability="customer.read_garage" />}>
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
                </Route>
                <Route
                  path="/settings"
                  element={
                    <LazyPage>
                      <SettingsPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/staff/waitlists"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route element={<CapabilityRoute capability="incident.compensation.issue" />}>
                  <Route
                    path="/staff/vouchers"
                    element={
                      <LazyPage>
                        <StaffCompensationVouchersPage />
                      </LazyPage>
                    }
                  />
                </Route>
                <Route element={<CapabilityRoute capability="booking_handover.manage_garage" />}>
                  <Route
                    path="/staff/handover/:bookingId"
                    element={
                      <LazyPage>
                        <StaffHandoverPage />
                      </LazyPage>
                    }
                  />
                </Route>
                <Route element={<CapabilityRoute capability="customer_case.technical_assess_assigned" />}>
                  <Route
                    path="/staff/cases/:caseId/technical-assessment"
                    element={
                      <LazyPage>
                        <StaffTechnicalAssessmentPage />
                      </LazyPage>
                    }
                  />
                </Route>
                <Route element={<CapabilityRoute capability="customer_case.read_garage" />}>
                  <Route
                    path="/staff/cases"
                    element={
                      <LazyPage>
                        <StaffCustomerCasesPage />
                      </LazyPage>
                    }
                  />
                  <Route element={<CapabilityRoute capability="customer_case.sla.read_garage" />}>
                    <Route
                      path="/staff/cases/sla"
                      element={
                        <LazyPage>
                          <StaffCustomerCaseSlaDashboardPage />
                        </LazyPage>
                      }
                    />
                  </Route>
                  <Route element={<CapabilityRoute capability="customer_case.create_walk_in" />}>
                    <Route
                      path="/staff/cases/walk-in"
                      element={
                        <LazyPage>
                          <StaffWalkInCaseCreatePage />
                        </LazyPage>
                      }
                    />
                  </Route>
                  <Route
                    path="/staff/cases/:caseId"
                    element={
                      <LazyPage>
                        <StaffCustomerCaseDetailPage />
                      </LazyPage>
                    }
                  />
                </Route>
                <Route element={<CapabilityRoute capability="review.read_garage" />}>
                  <Route
                    path="/staff/reviews"
                    element={
                      <LazyPage>
                        <StaffReviewsPage />
                      </LazyPage>
                    }
                  />
                </Route>
                <Route element={<CapabilityRoute capability="booking.plate_scan" />}>
                  <Route
                    path="/staff/arrivals"
                    element={
                      <LazyPage>
                        <StaffArrivalQueuePage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/staff/arrivals/:scanId"
                    element={
                      <LazyPage>
                        <StaffPlateScanDetailPage />
                      </LazyPage>
                    }
                  />
                </Route>
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
