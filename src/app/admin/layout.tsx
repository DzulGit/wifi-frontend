'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [paymentCount, setPaymentCount] = useState(0)
  const [ticketCount, setTicketCount] = useState(0)
  const { isAuthenticated, isAdmin } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return

    // Fetch badge counts dari API
    const fetchCounts = async () => {
      try {
        const [regStats, payStats, ticketStats] = await Promise.all([
          api.get('/registrations/stats'),
          api.get('/payments/stats'),
          api.get('/tickets/stats'),
        ])
        setPendingCount(regStats.data.pending ?? 0)
        setPaymentCount(payStats.data.pending ?? 0)
        setTicketCount(ticketStats.data.open ?? 0)
      } catch {}
    }

    fetchCounts()
    // Refresh setiap 30 detik
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated, isAdmin])

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        pendingCount={pendingCount}
        paymentCount={paymentCount}
        ticketCount={ticketCount}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen w-full transition-all duration-300">
        {/* Header Mobile */}
        <header className="h-16 bg-white border-b flex items-center px-4 sticky top-0 z-30 lg:hidden shadow-sm">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 mr-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg text-[#F5A623]">CAKRANA</h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}