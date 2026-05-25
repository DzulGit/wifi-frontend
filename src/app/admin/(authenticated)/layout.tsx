'use client'

import { useState, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminNavbar from '@/components/admin/AdminNavbar'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'

const PAGE_HEADERS: Record<string, { title: string; subtitle?: string }> = {
  '/admin/dashboard': {
    title: 'Dashboard',
    subtitle: 'Ringkasan aktivitas sistem CAKRANA WiFi',
  },
  '/admin/pendaftar': {
    title: 'Pendaftar Baru',
    subtitle: 'Kelola pendaftaran pelanggan baru dari landing page',
  },
  '/admin/pelanggan': {
    title: 'Manajemen Pelanggan',
    subtitle: 'Kelola seluruh data pelanggan WiFi',
  },
  '/admin/paket': {
    title: 'Manajemen Paket',
    subtitle: 'Kelola paket layanan internet CAKRANA',
  },
  '/admin/tagihan': {
    title: 'Manajemen Tagihan',
    subtitle: 'Kelola tagihan bulanan pelanggan',
  },
  '/admin/pembayaran': {
    title: 'Manajemen Pembayaran',
    subtitle: 'Validasi pembayaran tagihan pelanggan',
  },
  '/admin/permintaan': {
    title: 'Permintaan Pelanggan',
    subtitle: 'Kelola permohonan ganti paket, pindah alamat, dan putus berlangganan',
  },
  '/admin/logs': {
    title: 'System Logs',
    subtitle: 'Pantau aktivitas API secara real-time',
  },
  '/admin/laporan': {
    title: 'Laporan & Analitik',
    subtitle: 'Ringkasan performa sistem CAKRANA WiFi',
  },
  '/admin/tiket': {
    title: 'Helpdesk & Tiket',
    subtitle: 'Tangani laporan dan pertanyaan pelanggan',
  },
  '/admin/pengaturan': {
    title: 'Pengaturan Sistem',
    subtitle: 'Konfigurasi global aplikasi CAKRANA WiFi',
  },
}

function getPageHeader(pathname: string) {
  if (PAGE_HEADERS[pathname]) return PAGE_HEADERS[pathname]
  const matched = Object.keys(PAGE_HEADERS).find((path) => pathname.startsWith(`${path}/`))
  if (matched) return PAGE_HEADERS[matched]
  return { title: 'Admin Panel', subtitle: 'CAKRANA WiFi' }
}

export default function AuthenticatedAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [paymentCount, setPaymentCount] = useState(0)
  const [ticketCount, setTicketCount] = useState(0)
  const [requestCount, setRequestCount] = useState(0)
  const { isAuthenticated, isAdmin } = useAuthStore()

  const { title, subtitle } = useMemo(() => getPageHeader(pathname), [pathname])

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return

    const fetchCounts = async () => {
      try {
        const [regStats, payStats, ticketStats, notifRes] = await Promise.all([
          api.get('/registrations/stats'),
          api.get('/payments/stats'),
          api.get('/tickets/stats'),
          api.get('/admin/notifications?category=SYSTEM&limit=100'),
        ])
        setPendingCount(regStats.data.pending ?? 0)
        setPaymentCount(payStats.data.pending ?? 0)
        setTicketCount(ticketStats.data.open ?? 0)

        const systemNotifs: { isRead: boolean; title: string }[] = notifRes.data.notifications ?? []
        const userRequestKeywords = ['Ganti Paket', 'Pindah Alamat', 'Putus Berlangganan']
        const unprocessed = systemNotifs.filter(
          (n) => !n.isRead && userRequestKeywords.some((kw) => n.title.includes(kw))
        )
        setRequestCount(unprocessed.length)
      } catch {}
    }

    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated, isAdmin])

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <AdminSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        pendingCount={pendingCount}
        paymentCount={paymentCount}
        ticketCount={ticketCount}
        requestCount={requestCount}
      />

      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen w-full transition-all duration-300">
        {/* Tombol menu sidebar — mobile */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 sticky top-0 z-30 lg:hidden shadow-sm">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 mr-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Buka menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg text-[#F5A623]">CAKRANA</h1>
        </header>

        {/* Navbar admin: notifikasi, pengaturan, profil */}
        <AdminNavbar title={title} subtitle={subtitle} />

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
