import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/store/authStore'
import { SettingsProvider } from '@/store/settingsStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CallsPage } from '@/pages/CallsPage'
import { NewCallPage } from '@/pages/NewCallPage'
import { FindTechnicianPage } from '@/pages/FindTechnicianPage'
import { TechniciansPage } from '@/pages/TechniciansPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { ServiceRequestsPage } from '@/pages/ServiceRequestsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { UsersPage } from '@/pages/UsersPage'
import { ServicesPage } from '@/pages/ServicesPage'
import { TechnicianReportPage } from '@/pages/TechnicianReportPage'
import { LogsPage } from '@/pages/LogsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { TechnicianPlansPage } from '@/pages/TechnicianPlansPage'
import { Toaster } from '@/components/ui/toaster'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Connecting to US Platform...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Verifying Administrator Access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public login & technician job report */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/job-report/:token" element={<TechnicianReportPage />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/calls" element={<CallsPage />} />
              <Route path="/calls/new" element={<NewCallPage />} />
              <Route path="/technicians" element={<TechniciansPage />} />
              <Route path="/technicians/find" element={<FindTechnicianPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/service-requests" element={<ServiceRequestsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />

              {/* Admin-only routes */}
              <Route
                path="/users"
                element={
                  <AdminRoute>
                    <UsersPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/logs"
                element={
                  <AdminRoute>
                    <LogsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/technician-plans"
                element={
                  <AdminRoute>
                    <TechnicianPlansPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <AdminRoute>
                    <SettingsPage />
                  </AdminRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  )
}
