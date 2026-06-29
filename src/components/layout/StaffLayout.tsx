import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { BookingProvider } from '../../contexts/BookingContext'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function StaffLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <BookingProvider>
      <div className="min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="min-w-0 lg:pl-[240px]">
          <Header />
          <main className="mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:p-8">
            <ErrorBoundary scope="nội dung trang">
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </BookingProvider>
  )
}
