import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function StaffLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-w-0 lg:pl-[17.5rem]">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] p-4 md:p-5 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
