'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminNavbar from '@/components/admin/AdminNavbar'
import api from '@/lib/api'

interface AdminLayoutWrapperProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export default function AdminLayoutWrapper({ children, title, subtitle }: AdminLayoutWrapperProps) {
  const { isAuthenticated, isAdmin } = useAuthStore()
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)
  const [paymentCount, setPaymentCount] = useState(0)
  const [ticketCount, setTicketCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/admin/login'); return }
    if (!isAdmin) { router.push('/dashboard'); return }

    // Fetch badge counts
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
  }, [isAuthenticated, isAdmin, router])

  if (!isAuthenticated || !isAdmin) return null

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      <AdminSidebar
        pendingCount={pendingCount}
        paymentCount={paymentCount}
        ticketCount={ticketCount}
      />
      <div className="ml-[220px] flex flex-col min-h-screen">
        <AdminNavbar title={title} subtitle={subtitle} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}